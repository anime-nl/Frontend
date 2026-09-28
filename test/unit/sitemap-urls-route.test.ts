import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import type {H3Event} from 'h3'

const medusaFetch = vi.fn()

beforeEach(() => {
    vi.stubGlobal('defineSitemapEventHandler', (handler: unknown) => handler)
    vi.stubGlobal('createError', (input: object) => Object.assign(new Error(), input))
    vi.stubGlobal('medusaFetch', medusaFetch)
})

afterEach(() => {
    vi.unstubAllGlobals()
    medusaFetch.mockReset()
})

async function callRoute() {
    const {default: handler} = await import('../../server/api/sitemap-urls')
    return (handler as (event: H3Event) => Promise<unknown>)({} as H3Event)
}

describe('GET /api/sitemap-urls', () => {
    it('returns a sitemap entry for every product', async () => {
        medusaFetch.mockResolvedValue({
            products: [
                {id: 'prod_1', updated_at: '2026-01-01T00:00:00.000Z'},
                {id: 'prod_2', updated_at: '2026-01-02T00:00:00.000Z'}
            ],
            count: 2
        })

        await expect(callRoute()).resolves.toEqual([
            {loc: '/product/prod_1', lastmod: '2026-01-01T00:00:00.000Z'},
            {loc: '/product/prod_2', lastmod: '2026-01-02T00:00:00.000Z'}
        ])
    })

    it('omits lastmod for a product with no updated_at', async () => {
        medusaFetch.mockResolvedValue({products: [{id: 'prod_1', updated_at: null}], count: 1})

        await expect(callRoute()).resolves.toEqual([{loc: '/product/prod_1', lastmod: undefined}])
    })

    it('pages through the full catalog when it is larger than one page', async () => {
        medusaFetch
            .mockResolvedValueOnce({
                products: Array.from({length: 100}, (_, i) => ({
                    id: `prod_${i}`,
                    updated_at: '2026-01-01T00:00:00.000Z'
                })),
                count: 101
            })
            .mockResolvedValueOnce({
                products: [{id: 'prod_100', updated_at: '2026-01-01T00:00:00.000Z'}],
                count: 101
            })

        const urls = (await callRoute()) as {loc: string}[]

        expect(medusaFetch).toHaveBeenCalledTimes(2)
        expect(medusaFetch).toHaveBeenNthCalledWith(1, expect.anything(), 'products', {
            query: {limit: 100, offset: 0, fields: 'id,updated_at'}
        })
        expect(medusaFetch).toHaveBeenNthCalledWith(2, expect.anything(), 'products', {
            query: {limit: 100, offset: 100, fields: 'id,updated_at'}
        })
        expect(urls).toHaveLength(101)
        expect(urls.at(-1)).toEqual({loc: '/product/prod_100', lastmod: '2026-01-01T00:00:00.000Z'})
    })

    it('answers 500 when Medusa fails, instead of crashing the sitemap route', async () => {
        medusaFetch.mockRejectedValue(new Error('connect ECONNREFUSED'))

        await expect(callRoute()).rejects.toMatchObject({statusCode: 500, statusMessage: 'Could not fetch products'})
    })
})
