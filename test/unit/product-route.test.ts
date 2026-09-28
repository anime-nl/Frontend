import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import type {H3Event} from 'h3'

const medusaFetch = vi.fn()

beforeEach(() => {
    vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
    vi.stubGlobal('useRuntimeConfig', () => ({medusaSalesChannelId: ''}))
    vi.stubGlobal('getRouterParam', () => 'prod_1')
    vi.stubGlobal('getQuery', () => ({region_id: 'reg_nl'}))
    vi.stubGlobal('createError', (input: object) => Object.assign(new Error(), input))
    vi.stubGlobal('medusaFetch', medusaFetch)
})

afterEach(() => {
    vi.unstubAllGlobals()
    medusaFetch.mockReset()
})

async function callRoute() {
    const {default: handler} = await import('../../server/api/products/[id]')
    return (handler as (event: H3Event) => Promise<unknown>)({} as H3Event)
}

describe('GET /api/products/:id', () => {
    it('forwards the requested fields, region and sales channel as query params', async () => {
        medusaFetch.mockResolvedValue({product: {id: 'prod_1'}})

        await callRoute()

        expect(medusaFetch).toHaveBeenCalledWith(expect.anything(), 'products/prod_1', {
            query: {
                fields: expect.stringContaining('variants'),
                region_id: 'reg_nl',
                sales_channel_id: undefined
            }
        })
    })

    it('answers 400 when the route has no product id', async () => {
        vi.stubGlobal('getRouterParam', () => undefined)

        await expect(callRoute()).rejects.toMatchObject({statusCode: 400, statusMessage: 'Missing product id'})
        expect(medusaFetch).not.toHaveBeenCalled()
    })

    it('looks up the default region when none is given in the query', async () => {
        vi.stubGlobal('getQuery', () => ({}))
        medusaFetch.mockResolvedValueOnce({regions: [{id: 'reg_nl'}]}).mockResolvedValueOnce({product: {id: 'prod_1'}})

        await callRoute()

        expect(medusaFetch).toHaveBeenNthCalledWith(2, expect.anything(), 'products/prod_1', {
            query: {fields: expect.stringContaining('variants'), region_id: 'reg_nl', sales_channel_id: undefined}
        })
    })

    it('falls back to no region when the region lookup fails', async () => {
        vi.stubGlobal('getQuery', () => ({}))
        medusaFetch.mockRejectedValueOnce(new Error('down')).mockResolvedValueOnce({product: {id: 'prod_1'}})

        await callRoute()

        expect(medusaFetch).toHaveBeenNthCalledWith(2, expect.anything(), 'products/prod_1', {
            query: {fields: expect.stringContaining('variants'), region_id: undefined, sales_channel_id: undefined}
        })
    })

    it('answers 404 when Medusa does not know the product', async () => {
        medusaFetch.mockRejectedValue({statusCode: 404})

        await expect(callRoute()).rejects.toMatchObject({statusCode: 404, statusMessage: 'Product not found'})
    })

    it('answers 500 when Medusa fails', async () => {
        medusaFetch.mockRejectedValue(new Error('connect ECONNREFUSED'))

        await expect(callRoute()).rejects.toMatchObject({statusCode: 500, statusMessage: 'Could not fetch product'})
    })
})
