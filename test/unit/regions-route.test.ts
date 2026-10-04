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
    const {default: handler} = await import('../../server/api/regions')
    return (handler as (event: H3Event) => Promise<unknown>)({} as H3Event)
}

describe('GET /api/regions', () => {
    it('returns the regions from Medusa', async () => {
        medusaFetch.mockResolvedValue({regions: [{id: 'reg_nl'}]})

        await expect(callRoute()).resolves.toEqual({regions: [{id: 'reg_nl'}]})
    })

    it('returns an empty list when Medusa fails', async () => {
        medusaFetch.mockRejectedValue(new Error('connect ECONNREFUSED'))

        await expect(callRoute()).resolves.toEqual({regions: []})
    })

    it('does not re-fetch from Medusa on a second call within the cache window', async () => {
        medusaFetch.mockResolvedValue({regions: [{id: 'reg_nl'}]})

        await callRoute()
        await callRoute()

        expect(medusaFetch).toHaveBeenCalledTimes(1)
    })
})
