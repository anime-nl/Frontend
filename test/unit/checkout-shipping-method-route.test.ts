import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import type {H3Event} from 'h3'

const medusaFetch = vi.fn()
const getCookie = vi.fn()
let body: unknown

beforeEach(() => {
    body = {option_id: 'so_standard'}
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

async function callRoute() {
    const {default: handler} = await import('../../server/api/checkout/shipping-method.post')
    return (handler as (event: H3Event) => Promise<unknown>)({} as H3Event)
}

describe('POST /api/checkout/shipping-method', () => {
    it('requires an existing cart', async () => {
        getCookie.mockReturnValue(undefined)

        await expect(callRoute()).rejects.toMatchObject({statusCode: 400, statusMessage: 'No cart'})
        expect(medusaFetch).not.toHaveBeenCalled()
    })

    it('rejects a missing option_id', async () => {
        getCookie.mockReturnValue('cart_1')
        body = {}

        await expect(callRoute()).rejects.toMatchObject({statusCode: 400, statusMessage: 'Missing option_id'})
        expect(medusaFetch).not.toHaveBeenCalled()
    })

    it('rejects an empty request body', async () => {
        getCookie.mockReturnValue('cart_1')
        body = undefined

        await expect(callRoute()).rejects.toMatchObject({statusCode: 400, statusMessage: 'Missing option_id'})
        expect(medusaFetch).not.toHaveBeenCalled()
    })

    it('sets the shipping method on the cart', async () => {
        getCookie.mockReturnValue('cart_1')
        medusaFetch.mockResolvedValue({cart: {id: 'cart_1', shipping_methods: [{id: 'sm_1'}]}})

        await expect(callRoute()).resolves.toEqual({cart: {id: 'cart_1', shipping_methods: [{id: 'sm_1'}]}})
        expect(medusaFetch).toHaveBeenCalledWith(expect.anything(), 'carts/cart_1/shipping-methods', {
            method: 'POST',
            body: {option_id: 'so_standard'},
            query: {fields: expect.stringContaining('shipping_methods')}
        })
    })
})
