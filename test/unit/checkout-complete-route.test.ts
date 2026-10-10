import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import type {H3Event} from 'h3'
import {signOrderId} from '../../server/utils/orderToken'

const medusaFetch = vi.fn()
const getCookie = vi.fn()
const deleteCookie = vi.fn()
const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

beforeEach(() => {
    vi.stubGlobal('useRuntimeConfig', () => ({orderLinkSecret: 'test-secret'}))
    vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
    vi.stubGlobal('createError', (input: object) => Object.assign(new Error(), input))
    vi.stubGlobal('medusaFetch', medusaFetch)
    vi.stubGlobal('getCookie', getCookie)
    vi.stubGlobal('deleteCookie', deleteCookie)
})

afterEach(() => {
    vi.unstubAllGlobals()
    medusaFetch.mockReset()
    getCookie.mockReset()
    deleteCookie.mockReset()
    consoleError.mockClear()
})

/** The error Medusa returns while the Mollie plugin's authorizePayment rejects an unpaid payment. */
function mollieError(status: string) {
    return Object.assign(new Error('400 Bad Request'), {
        statusCode: 400,
        data: {type: 'invalid_data', message: `Payment is not authorized: current status is ${status}`}
    })
}

async function callRoute() {
    const {default: handler} = await import('../../server/api/checkout/complete.post')
    return (handler as (event: H3Event) => Promise<unknown>)({} as H3Event)
}

describe('POST /api/checkout/complete', () => {
    it('requires an existing cart', async () => {
        getCookie.mockReturnValue(undefined)

        await expect(callRoute()).rejects.toMatchObject({statusCode: 400, statusMessage: 'No cart'})
        expect(medusaFetch).not.toHaveBeenCalled()
    })

    it('returns the order and clears the cart cookie on success', async () => {
        getCookie.mockImplementation((_event: unknown, name: string) => (name === 'cart_id' ? 'cart_1' : undefined))
        medusaFetch.mockResolvedValue({type: 'order', order: {id: 'order_1', display_id: 42}})

        await expect(callRoute()).resolves.toEqual({
            status: 'completed',
            order: {id: 'order_1', display_id: 42},
            token: signOrderId('order_1', 'test-secret')
        })
        expect(medusaFetch).toHaveBeenCalledWith(expect.anything(), 'carts/cart_1/complete', {method: 'POST'})
        expect(deleteCookie).toHaveBeenCalledWith(expect.anything(), 'cart_id', {path: '/'})
    })

    it('returns a pending status without clearing the cookie when payment needs more action', async () => {
        getCookie.mockImplementation((_event: unknown, name: string) => (name === 'cart_id' ? 'cart_1' : undefined))
        medusaFetch.mockResolvedValue({
            type: 'cart',
            cart: {id: 'cart_1'},
            error: {type: 'PAYMENT_REQUIRES_MORE_ERROR', message: 'requires more', name: 'PaymentError'}
        })

        await expect(callRoute()).resolves.toEqual({status: 'pending', cart: {id: 'cart_1'}})
        expect(deleteCookie).not.toHaveBeenCalled()
    })

    it('returns a failed status when the payment was declined', async () => {
        getCookie.mockImplementation((_event: unknown, name: string) => (name === 'cart_id' ? 'cart_1' : undefined))
        medusaFetch.mockResolvedValue({
            type: 'cart',
            cart: {id: 'cart_1'},
            error: {type: 'PAYMENT_AUTHORIZATION_ERROR', message: 'declined', name: 'PaymentError'}
        })

        await expect(callRoute()).resolves.toEqual({status: 'failed', cart: {id: 'cart_1'}})
        expect(deleteCookie).not.toHaveBeenCalled()
    })

    it('forwards the medusa_session token for a signed-in customer', async () => {
        getCookie.mockImplementation((_event: unknown, name: string) =>
            name === 'cart_id' ? 'cart_1' : name === 'medusa_session' ? 'jwt-token' : undefined
        )
        medusaFetch.mockResolvedValue({type: 'order', order: {id: 'order_1'}})

        await callRoute()

        expect(medusaFetch).toHaveBeenCalledWith(expect.anything(), 'carts/cart_1/complete', {
            method: 'POST',
            token: 'jwt-token'
        })
    })

    it('omits the order link token when no secret is configured', async () => {
        vi.stubGlobal('useRuntimeConfig', () => ({}))
        getCookie.mockImplementation((_event: unknown, name: string) => (name === 'cart_id' ? 'cart_1' : undefined))
        medusaFetch.mockResolvedValue({type: 'order', order: {id: 'order_1'}})

        await expect(callRoute()).resolves.toEqual({status: 'completed', order: {id: 'order_1'}})
    })

    it.each(['open', 'pending'])('reports pending while Mollie says the payment is %s', async (mollieStatus) => {
        getCookie.mockImplementation((_event: unknown, name: string) => (name === 'cart_id' ? 'cart_1' : undefined))
        medusaFetch.mockRejectedValue(mollieError(mollieStatus))

        await expect(callRoute()).resolves.toEqual({status: 'pending'})
        expect(deleteCookie).not.toHaveBeenCalled()
    })

    it.each(['failed', 'canceled', 'expired'])(
        'reports failed when Mollie says the payment is %s',
        async (mollieStatus) => {
            getCookie.mockImplementation((_event: unknown, name: string) => (name === 'cart_id' ? 'cart_1' : undefined))
            medusaFetch.mockRejectedValue(mollieError(mollieStatus))

            await expect(callRoute()).resolves.toEqual({status: 'failed'})
            expect(deleteCookie).not.toHaveBeenCalled()
        }
    )

    it('reports pending for a Medusa error it cannot interpret instead of telling the customer they failed', async () => {
        getCookie.mockImplementation((_event: unknown, name: string) => (name === 'cart_id' ? 'cart_1' : undefined))
        medusaFetch.mockRejectedValue(Object.assign(new Error('boom'), {statusCode: 500, data: {message: 'oops'}}))

        await expect(callRoute()).resolves.toEqual({status: 'pending'})
        expect(consoleError).toHaveBeenCalled()
    })

    it('fails with 502 when Medusa cannot be reached at all', async () => {
        getCookie.mockImplementation((_event: unknown, name: string) => (name === 'cart_id' ? 'cart_1' : undefined))
        medusaFetch.mockRejectedValue(new Error('medusa unreachable'))

        await expect(callRoute()).rejects.toMatchObject({statusCode: 502, statusMessage: 'Could not complete order'})
        expect(deleteCookie).not.toHaveBeenCalled()
    })
})
