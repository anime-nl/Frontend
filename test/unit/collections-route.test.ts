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
    const {default: handler} = await import('../../server/api/collections')
    return (handler as (event: H3Event) => Promise<unknown>)({} as H3Event)
}

describe('GET /api/collections', () => {
    it('returns the collections from Medusa', async () => {
        medusaFetch.mockResolvedValue({collections: [{id: 'pcol_1', title: 'Genshin Impact'}]})

        await expect(callRoute()).resolves.toEqual({collections: [{id: 'pcol_1', title: 'Genshin Impact'}]})
    })

    it('returns an empty list when Medusa fails', async () => {
        medusaFetch.mockRejectedValue(new Error('connect ECONNREFUSED'))

        await expect(callRoute()).resolves.toEqual({collections: []})
    })

    it('does not re-fetch from Medusa on a second call within the cache window', async () => {
        medusaFetch.mockResolvedValue({collections: [{id: 'pcol_1', title: 'Genshin Impact'}]})

        await callRoute()
        await callRoute()

        expect(medusaFetch).toHaveBeenCalledTimes(1)
    })
})
