import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import type {H3Event} from 'h3'

const medusaFetch = vi.fn()

beforeEach(() => {
    vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
    vi.stubGlobal('getQuery', () => ({category_id: ['pcat_1']}))
    vi.stubGlobal('createError', (input: object) => Object.assign(new Error(), input))
    vi.stubGlobal('medusaFetch', medusaFetch)
})

afterEach(() => {
    vi.unstubAllGlobals()
    medusaFetch.mockReset()
})

async function callRoute() {
    const {default: handler} = await import('../../server/api/products')
    return (handler as (event: H3Event) => Promise<unknown>)({} as H3Event)
}

describe('GET /api/products', () => {
    it('passes the request query on to Medusa', async () => {
        medusaFetch.mockResolvedValue({products: [{id: 'prod_1'}], count: 1})

        await expect(callRoute()).resolves.toEqual({products: [{id: 'prod_1'}], count: 1})
        expect(medusaFetch).toHaveBeenCalledWith(expect.anything(), 'products', {query: {category_id: ['pcat_1']}})
    })

    it('answers 500 when Medusa fails', async () => {
        medusaFetch.mockRejectedValue(new Error('connect ECONNREFUSED'))

        await expect(callRoute()).rejects.toMatchObject({statusCode: 500, statusMessage: 'Could not fetch products'})
    })
})

describe('GET /api/products with filters Medusa cannot do', () => {
    const product = (id: string, amount: number, extra: object = {}) => ({
        id,
        variants: [
            {calculated_price: {calculated_amount: amount, original_amount: amount}, inventory_quantity: 1, ...extra}
        ]
    })

    function stubQuery(query: Record<string, unknown>) {
        vi.stubGlobal('getQuery', () => query)
    }

    it('translates the newest and title sorts to a Medusa order', async () => {
        stubQuery({sort: 'newest', q: 'goku'})
        medusaFetch.mockResolvedValue({products: [], count: 0})

        await callRoute()

        expect(medusaFetch).toHaveBeenCalledWith(expect.anything(), 'products', {
            query: {q: 'goku', order: '-created_at'}
        })
    })

    it('filters on price across the whole catalog and pages the result', async () => {
        stubQuery({min_price: '10', max_price: '30', limit: '1', offset: '1', fields: '*variants.calculated_price'})
        medusaFetch.mockResolvedValue({
            products: [product('cheap', 5), product('a', 15), product('b', 25), product('dear', 50)],
            count: 4
        })

        const result = (await callRoute()) as {products: {id: string}[]; count: number}

        expect(result.products.map((p) => p.id)).toEqual(['b'])
        expect(result.count).toBe(2)
    })

    it('does not send our own params, limit or offset to Medusa while scanning, and asks for stock fields', async () => {
        stubQuery({in_stock: 'true', limit: '12', offset: '0', category_id: ['pcat_1'], fields: 'title'})
        medusaFetch.mockResolvedValue({products: [], count: 0})

        await callRoute()

        expect(medusaFetch).toHaveBeenCalledWith(expect.anything(), 'products', {
            query: {
                category_id: ['pcat_1'],
                fields: 'title,+variants.inventory_quantity,+variants.manage_inventory,+variants.allow_backorder',
                limit: 100,
                offset: 0
            }
        })
    })

    it('keeps fetching pages until it has seen every product', async () => {
        stubQuery({on_sale: 'true'})
        const full = Array.from({length: 100}, (_, i) => product(`p${i}`, 10))
        medusaFetch
            .mockResolvedValueOnce({products: full, count: 101})
            .mockResolvedValueOnce({products: [product('last', 10)], count: 101})

        await callRoute()

        expect(medusaFetch).toHaveBeenCalledTimes(2)
        expect(medusaFetch.mock.calls[1]?.[2]).toMatchObject({query: {offset: 100}})
    })

    it('only returns products that are on sale when asked to', async () => {
        stubQuery({on_sale: 'true'})
        medusaFetch.mockResolvedValue({
            products: [
                product('regular', 10),
                {id: 'sale', variants: [{calculated_price: {calculated_amount: 8, original_amount: 10}}]}
            ],
            count: 2
        })

        const result = (await callRoute()) as {products: {id: string}[]}

        expect(result.products.map((p) => p.id)).toEqual(['sale'])
    })

    it('sorts by price', async () => {
        stubQuery({sort: 'price_desc'})
        medusaFetch.mockResolvedValue({products: [product('cheap', 5), product('dear', 50)], count: 2})

        const result = (await callRoute()) as {products: {id: string}[]}

        expect(result.products.map((p) => p.id)).toEqual(['dear', 'cheap'])
    })
})
