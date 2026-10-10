import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import type {H3Event} from 'h3'
import {signOrderId} from '../../server/utils/orderToken'

const medusaFetch = vi.fn()
const getCookie = vi.fn()
const getQuery = vi.fn()
const getRouterParam = vi.fn()

beforeEach(() => {
    vi.stubGlobal('useRuntimeConfig', () => ({orderLinkSecret: 'test-secret'}))
    vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
    vi.stubGlobal('createError', (input: object) => Object.assign(new Error(), input))
    vi.stubGlobal('medusaFetch', medusaFetch)
    vi.stubGlobal('getCookie', getCookie)
    vi.stubGlobal('getQuery', getQuery)
    vi.stubGlobal('getRouterParam', getRouterParam)
    getRouterParam.mockReturnValue('order_1')
    getQuery.mockReturnValue({})
})

afterEach(() => {
    vi.unstubAllGlobals()
    medusaFetch.mockReset()
    getCookie.mockReset()
    getQuery.mockReset()
    getRouterParam.mockReset()
})

async function callRoute() {
    const {default: handler} = await import('../../server/api/orders/[id].get')
    return (handler as (event: H3Event) => Promise<unknown>)({} as H3Event)
}

describe('GET /api/orders/:id', () => {
    it('returns the order for a valid token without any session', async () => {
        getQuery.mockReturnValue({token: signOrderId('order_1', 'test-secret')})
        medusaFetch.mockResolvedValue({order: {id: 'order_1'}})

        await expect(callRoute()).resolves.toEqual({order: {id: 'order_1'}})
        expect(medusaFetch).toHaveBeenCalledWith(expect.anything(), 'orders/order_1', expect.anything())
    })

    it('answers 404 for a token signed for another order', async () => {
        getQuery.mockReturnValue({token: signOrderId('order_2', 'test-secret')})

        await expect(callRoute()).rejects.toMatchObject({statusCode: 404})
        expect(medusaFetch).not.toHaveBeenCalled()
    })

    it('answers 404 with neither a token nor a session', async () => {
        await expect(callRoute()).rejects.toMatchObject({statusCode: 404})
        expect(medusaFetch).not.toHaveBeenCalled()
    })

    it('returns the order to the signed-in customer who owns it', async () => {
        getCookie.mockReturnValue('tok_123')
        medusaFetch.mockImplementation(async (_event: unknown, path: string) =>
            path === 'orders' ? {orders: [{id: 'order_1'}]} : {order: {id: 'order_1'}}
        )

        await expect(callRoute()).resolves.toEqual({order: {id: 'order_1'}})
        expect(medusaFetch).toHaveBeenCalledWith(expect.anything(), 'orders', {
            token: 'tok_123',
            query: {id: 'order_1', fields: 'id'}
        })
    })

    it('answers 404 to a signed-in customer who does not own the order', async () => {
        getCookie.mockReturnValue('tok_123')
        medusaFetch.mockResolvedValue({orders: []})

        await expect(callRoute()).rejects.toMatchObject({statusCode: 404})
        expect(medusaFetch).toHaveBeenCalledTimes(1)
    })

    it('answers 404 when the session token is expired', async () => {
        getCookie.mockReturnValue('expired')
        medusaFetch.mockRejectedValue(Object.assign(new Error(), {statusCode: 401}))

        await expect(callRoute()).rejects.toMatchObject({statusCode: 404})
    })

    it('does not accept a token when no secret is configured', async () => {
        vi.stubGlobal('useRuntimeConfig', () => ({}))
        getQuery.mockReturnValue({token: signOrderId('order_1', '')})

        await expect(callRoute()).rejects.toMatchObject({statusCode: 404})
    })
})
