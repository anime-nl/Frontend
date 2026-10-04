import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import type {H3Event} from 'h3'
import {clearCache, withTtlCache} from '../../server/utils/cache'

const medusaFetch = vi.fn()

beforeEach(() => {
    vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
    vi.stubGlobal('medusaFetch', medusaFetch)
    vi.stubGlobal('withTtlCache', withTtlCache)
})

afterEach(() => {
    vi.unstubAllGlobals()
    medusaFetch.mockReset()
    clearCache()
})

async function callRoute() {
    const {default: handler} = await import('../../server/api/categories')
    return (handler as (event: H3Event) => Promise<unknown>)({} as H3Event)
}

describe('GET /api/categories', () => {
    it('returns the categories from Medusa', async () => {
        medusaFetch.mockResolvedValue({product_categories: [{id: 'pcat_1', name: 'TCG'}]})

        await expect(callRoute()).resolves.toEqual({product_categories: [{id: 'pcat_1', name: 'TCG'}]})
    })

    it('returns an empty list when Medusa fails', async () => {
        medusaFetch.mockRejectedValue(new Error('connect ECONNREFUSED'))

        await expect(callRoute()).resolves.toEqual({product_categories: []})
    })

    it('does not re-fetch from Medusa on a second call within the cache window', async () => {
        medusaFetch.mockResolvedValue({product_categories: [{id: 'pcat_1', name: 'TCG'}]})

        await callRoute()
        await callRoute()

        expect(medusaFetch).toHaveBeenCalledTimes(1)
    })
})
