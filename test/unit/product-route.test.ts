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
    it('answers 404 when Medusa does not know the product', async () => {
        medusaFetch.mockRejectedValue({statusCode: 404})

        await expect(callRoute()).rejects.toMatchObject({statusCode: 404, statusMessage: 'Product not found'})
    })

    it('answers 500 when Medusa fails', async () => {
        medusaFetch.mockRejectedValue(new Error('connect ECONNREFUSED'))

        await expect(callRoute()).rejects.toMatchObject({statusCode: 500, statusMessage: 'Could not fetch product'})
    })
})
