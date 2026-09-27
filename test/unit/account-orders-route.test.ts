import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import type {H3Event} from 'h3'

const medusaFetch = vi.fn()
const getCookie = vi.fn()

beforeEach(() => {
    vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
    vi.stubGlobal('createError', (input: object) => Object.assign(new Error(), input))
    vi.stubGlobal('medusaFetch', medusaFetch)
    vi.stubGlobal('getCookie', getCookie)
})

afterEach(() => {
    vi.unstubAllGlobals()
    medusaFetch.mockReset()
    getCookie.mockReset()
})

async function callRoute() {
    const {default: handler} = await import('../../server/api/account/orders.get')
    return (handler as (event: H3Event) => Promise<unknown>)({} as H3Event)
}

describe('GET /api/account/orders', () => {
    it('answers 401 with no session cookie', async () => {
        getCookie.mockReturnValue(undefined)

        await expect(callRoute()).rejects.toMatchObject({statusCode: 401})
        expect(medusaFetch).not.toHaveBeenCalled()
    })

    it('forwards the session token and returns the orders', async () => {
        getCookie.mockReturnValue('tok_123')
        medusaFetch.mockResolvedValue({orders: [{id: 'order_1'}]})

        await expect(callRoute()).resolves.toEqual({orders: [{id: 'order_1'}]})
        expect(medusaFetch).toHaveBeenCalledWith(expect.anything(), 'orders', {
            token: 'tok_123',
            query: {limit: 20, order: '-created_at'}
        })
    })
})
