import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import type {H3Event} from 'h3'

const medusaFetch = vi.fn()
const getCookie = vi.fn()
const deleteCookie = vi.fn()
const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

beforeEach(() => {
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

        await expect(callRoute()).resolves.toEqual({status: 'completed', order: {id: 'order_1', display_id: 42}})
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

    it('fails with 502 when Medusa errors completing the cart', async () => {
        getCookie.mockImplementation((_event: unknown, name: string) => (name === 'cart_id' ? 'cart_1' : undefined))
        medusaFetch.mockRejectedValue(new Error('medusa unreachable'))

        await expect(callRoute()).rejects.toMatchObject({statusCode: 502, statusMessage: 'Could not complete order'})
        expect(deleteCookie).not.toHaveBeenCalled()
    })
})
