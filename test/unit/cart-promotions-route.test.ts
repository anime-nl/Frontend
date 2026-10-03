import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import type {H3Event} from 'h3'

const medusaFetch = vi.fn()
const getCookie = vi.fn()
let body: unknown

beforeEach(() => {
    body = {code: 'WELCOME10'}
    vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
    vi.stubGlobal('readBody', async () => body)
    vi.stubGlobal('createError', (input: object) => Object.assign(new Error(), input))
    vi.stubGlobal('medusaFetch', medusaFetch)
    vi.stubGlobal('getCookie', getCookie)
})

afterEach(() => {
    vi.unstubAllGlobals()
    medusaFetch.mockReset()
    getCookie.mockReset()
})

async function callPostRoute() {
    const {default: handler} = await import('../../server/api/cart/promotions.post')
    return (handler as (event: H3Event) => Promise<unknown>)({} as H3Event)
}

async function callDeleteRoute() {
    const {default: handler} = await import('../../server/api/cart/promotions.delete')
    return (handler as (event: H3Event) => Promise<unknown>)({} as H3Event)
}

describe('POST /api/cart/promotions', () => {
    it('requires an existing cart', async () => {
        getCookie.mockReturnValue(undefined)

        await expect(callPostRoute()).rejects.toMatchObject({statusCode: 400, statusMessage: 'No cart'})
        expect(medusaFetch).not.toHaveBeenCalled()
    })

    it('rejects a missing code', async () => {
        getCookie.mockReturnValue('cart_1')
        body = {}

        await expect(callPostRoute()).rejects.toMatchObject({statusCode: 400, statusMessage: 'Missing code'})
        expect(medusaFetch).not.toHaveBeenCalled()
    })

    it('rejects a blank code', async () => {
        getCookie.mockReturnValue('cart_1')
        body = {code: '   '}

        await expect(callPostRoute()).rejects.toMatchObject({statusCode: 400, statusMessage: 'Missing code'})
        expect(medusaFetch).not.toHaveBeenCalled()
    })

    it('applies the code to the cart', async () => {
        getCookie.mockReturnValue('cart_1')
        medusaFetch.mockResolvedValue({cart: {id: 'cart_1', promotions: [{code: 'WELCOME10'}]}})

        await expect(callPostRoute()).resolves.toEqual({cart: {id: 'cart_1', promotions: [{code: 'WELCOME10'}]}})
        expect(medusaFetch).toHaveBeenCalledWith(expect.anything(), 'carts/cart_1/promotions', {
            method: 'POST',
            body: {promo_codes: ['WELCOME10']},
            query: {fields: expect.stringContaining('promotions')}
        })
    })

    it('surfaces an invalid code as a 400 with Medusa message', async () => {
        getCookie.mockReturnValue('cart_1')
        medusaFetch.mockRejectedValue({
            statusCode: 400,
            data: {message: 'The promotion code BADCODE is invalid'}
        })

        await expect(callPostRoute()).rejects.toMatchObject({
            statusCode: 400,
            statusMessage: 'The promotion code BADCODE is invalid'
        })
    })

    it('tags a 400 with no Medusa message with a stable code, so the client can translate it', async () => {
        getCookie.mockReturnValue('cart_1')
        medusaFetch.mockRejectedValue({statusCode: 400, data: {}})

        await expect(callPostRoute()).rejects.toMatchObject({
            statusCode: 400,
            data: {code: 'invalidPromoCode'}
        })
    })

    it('surfaces an unexpected error as a 500', async () => {
        getCookie.mockReturnValue('cart_1')
        medusaFetch.mockRejectedValue(new Error('network down'))

        await expect(callPostRoute()).rejects.toMatchObject({statusCode: 500})
    })
})

describe('DELETE /api/cart/promotions', () => {
    it('requires an existing cart', async () => {
        getCookie.mockReturnValue(undefined)

        await expect(callDeleteRoute()).rejects.toMatchObject({statusCode: 400, statusMessage: 'No cart'})
        expect(medusaFetch).not.toHaveBeenCalled()
    })

    it('rejects a missing code', async () => {
        getCookie.mockReturnValue('cart_1')
        body = {}

        await expect(callDeleteRoute()).rejects.toMatchObject({statusCode: 400, statusMessage: 'Missing code'})
        expect(medusaFetch).not.toHaveBeenCalled()
    })

    it('removes the code from the cart', async () => {
        getCookie.mockReturnValue('cart_1')
        medusaFetch.mockResolvedValue({cart: {id: 'cart_1', promotions: []}})

        await expect(callDeleteRoute()).resolves.toEqual({cart: {id: 'cart_1', promotions: []}})
        expect(medusaFetch).toHaveBeenCalledWith(expect.anything(), 'carts/cart_1/promotions', {
            method: 'DELETE',
            body: {promo_codes: ['WELCOME10']},
            query: {fields: expect.stringContaining('promotions')}
        })
    })

    it('surfaces a Medusa failure as a 500 instead of an unhandled rejection', async () => {
        getCookie.mockReturnValue('cart_1')
        medusaFetch.mockRejectedValue(new Error('network down'))

        await expect(callDeleteRoute()).rejects.toMatchObject({statusCode: 500})
    })
})
