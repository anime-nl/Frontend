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
    const {default: handler} = await import('../../server/api/product-types')
    return (handler as (event: H3Event) => Promise<unknown>)({} as H3Event)
}

describe('GET /api/product-types', () => {
    it('returns the categories from Medusa', async () => {
        medusaFetch.mockResolvedValue({product_types: [{id: 'ptyp_1', value: 'TCG'}]})

        await expect(callRoute()).resolves.toEqual({product_types: [{id: 'ptyp_1', value: 'TCG'}]})
    })

    it('returns an empty list when Medusa fails', async () => {
        medusaFetch.mockRejectedValue(new Error('connect ECONNREFUSED'))

        await expect(callRoute()).resolves.toEqual({product_types: []})
    })

    it('does not re-fetch from Medusa on a second call within the cache window', async () => {
        medusaFetch.mockResolvedValue({product_types: [{id: 'ptyp_1', value: 'TCG'}]})

        await callRoute()
        await callRoute()

        expect(medusaFetch).toHaveBeenCalledTimes(1)
    })

    it('does not cache a failure, so a later call still reaches Medusa once it recovers', async () => {
        medusaFetch.mockRejectedValueOnce(new Error('connect ECONNREFUSED'))
        medusaFetch.mockResolvedValueOnce({product_types: [{id: 'ptyp_1', value: 'TCG'}]})

        await callRoute()

        await expect(callRoute()).resolves.toEqual({product_types: [{id: 'ptyp_1', value: 'TCG'}]})
    })
})
