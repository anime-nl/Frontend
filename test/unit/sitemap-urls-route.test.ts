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

const alternativesFor = (id: string) => [
    {hreflang: 'nl-NL', href: `/product/${id}`},
    {hreflang: 'en-GB', href: `/en/product/${id}`},
    {hreflang: 'de-DE', href: `/de/product/${id}`}
]

describe('GET /api/sitemap-urls', () => {
    it('returns one entry per locale for every product, cross-linked via alternatives', async () => {
        medusaFetch.mockResolvedValue({
            products: [{id: 'prod_1', updated_at: '2026-01-01T00:00:00.000Z'}],
            count: 1
        })

        await expect(callRoute()).resolves.toEqual([
            {
                loc: '/product/prod_1',
                lastmod: '2026-01-01T00:00:00.000Z',
                _sitemap: 'nl-NL',
                alternatives: alternativesFor('prod_1')
            },
            {
                loc: '/en/product/prod_1',
                lastmod: '2026-01-01T00:00:00.000Z',
                _sitemap: 'en-GB',
                alternatives: alternativesFor('prod_1')
            },
            {
                loc: '/de/product/prod_1',
                lastmod: '2026-01-01T00:00:00.000Z',
                _sitemap: 'de-DE',
                alternatives: alternativesFor('prod_1')
            }
        ])
    })

    it('omits lastmod for a product with no updated_at', async () => {
        medusaFetch.mockResolvedValue({products: [{id: 'prod_1', updated_at: null}], count: 1})

        const urls = (await callRoute()) as {lastmod?: string}[]

        expect(urls).toHaveLength(3)
        expect(urls.every((url) => url.lastmod === undefined)).toBe(true)
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
        // 101 products × 3 locales
        expect(urls).toHaveLength(303)
        expect(urls.at(-1)?.loc).toBe('/de/product/prod_100')
    })

    it('answers 500 when Medusa fails, instead of crashing the sitemap route', async () => {
        medusaFetch.mockRejectedValue(new Error('connect ECONNREFUSED'))

        await expect(callRoute()).rejects.toMatchObject({statusCode: 500, statusMessage: 'Could not fetch products'})
    })
})
