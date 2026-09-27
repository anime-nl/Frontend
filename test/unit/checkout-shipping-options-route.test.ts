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
    const {default: handler} = await import('../../server/api/checkout/shipping-options.get')
    return (handler as (event: H3Event) => Promise<unknown>)({} as H3Event)
}

describe('GET /api/checkout/shipping-options', () => {
    it('requires an existing cart', async () => {
        getCookie.mockReturnValue(undefined)

        await expect(callRoute()).rejects.toMatchObject({statusCode: 400, statusMessage: 'No cart'})
        expect(medusaFetch).not.toHaveBeenCalled()
    })

    it('returns the shipping options for the cart', async () => {
        getCookie.mockReturnValue('cart_1')
        medusaFetch.mockResolvedValue({
            shipping_options: [{id: 'so_standard', name: 'Standard', amount: 495}]
        })

        await expect(callRoute()).resolves.toEqual({
            shipping_options: [{id: 'so_standard', name: 'Standard', amount: 495}]
        })
        expect(medusaFetch).toHaveBeenCalledWith(expect.anything(), 'shipping-options', {query: {cart_id: 'cart_1'}})
    })
})
