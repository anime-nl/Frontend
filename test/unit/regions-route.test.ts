import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import type {H3Event} from 'h3'

const medusaFetch = vi.fn()

beforeEach(() => {
    vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
    vi.stubGlobal('medusaFetch', medusaFetch)
})

afterEach(() => {
    vi.unstubAllGlobals()
    medusaFetch.mockReset()
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
})
