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
        expect(medusaFetch).toHaveBeenCalledWith(expect.anything(), 'products', {category_id: ['pcat_1']})
    })

    it('answers 500 when Medusa fails', async () => {
        medusaFetch.mockRejectedValue(new Error('connect ECONNREFUSED'))

        await expect(callRoute()).rejects.toMatchObject({statusCode: 500, statusMessage: 'Could not fetch products'})
    })
})
