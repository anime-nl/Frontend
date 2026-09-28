import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import type {H3Event} from 'h3'

const medusaFetch = vi.fn()
const getCookie = vi.fn()
const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

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
    consoleError.mockClear()
})

async function callRoute() {
    const {default: handler} = await import('../../server/api/checkout/payment-session.post')
    return (handler as (event: H3Event) => Promise<unknown>)({} as H3Event)
}

describe('POST /api/checkout/payment-session', () => {
    it('requires an existing cart', async () => {
        getCookie.mockReturnValue(undefined)

        await expect(callRoute()).rejects.toMatchObject({statusCode: 400, statusMessage: 'No cart'})
        expect(medusaFetch).not.toHaveBeenCalled()
    })

    it('requires a shipping method to already be selected', async () => {
        getCookie.mockReturnValue('cart_1')
        medusaFetch.mockResolvedValueOnce({cart: {id: 'cart_1', shipping_methods: []}})

        await expect(callRoute()).rejects.toMatchObject({statusCode: 400, statusMessage: 'Cart has no shipping method'})
        expect(medusaFetch).toHaveBeenCalledTimes(1)
    })

    it('creates a Mollie payment session and returns its redirect url', async () => {
        getCookie.mockReturnValue('cart_1')
        medusaFetch
            .mockResolvedValueOnce({cart: {id: 'cart_1', shipping_methods: [{id: 'sm_1'}]}})
            .mockResolvedValueOnce({payment_collection: {id: 'pay_col_1'}})
            .mockResolvedValueOnce({
                payment_collection: {
                    id: 'pay_col_1',
                    payment_sessions: [
                        {
                            provider_id: 'pp_mollie-hosted-checkout_mollie',
                            data: {_links: {checkout: {href: 'https://mollie.example/checkout/abc'}}}
                        }
                    ]
                }
            })

        await expect(callRoute()).resolves.toEqual({redirect_url: 'https://mollie.example/checkout/abc'})
        expect(medusaFetch).toHaveBeenNthCalledWith(2, expect.anything(), 'payment-collections', {
            method: 'POST',
            body: {cart_id: 'cart_1'}
        })
        expect(medusaFetch).toHaveBeenNthCalledWith(
            3,
            expect.anything(),
            'payment-collections/pay_col_1/payment-sessions',
            {
                method: 'POST',
                body: {provider_id: 'pp_mollie-hosted-checkout_mollie'}
            }
        )
    })

    it('fails with 502 when Medusa errors creating the payment session', async () => {
        getCookie.mockReturnValue('cart_1')
        medusaFetch
            .mockResolvedValueOnce({cart: {id: 'cart_1', shipping_methods: [{id: 'sm_1'}]}})
            .mockRejectedValueOnce(new Error('medusa unreachable'))

        await expect(callRoute()).rejects.toMatchObject({statusCode: 502, statusMessage: 'Could not start payment'})
    })

    it('fails with 502 when the provider response has no redirect url', async () => {
        getCookie.mockReturnValue('cart_1')
        medusaFetch
            .mockResolvedValueOnce({cart: {id: 'cart_1', shipping_methods: [{id: 'sm_1'}]}})
            .mockResolvedValueOnce({payment_collection: {id: 'pay_col_1'}})
            .mockResolvedValueOnce({
                payment_collection: {
                    id: 'pay_col_1',
                    payment_sessions: [{provider_id: 'pp_mollie-hosted-checkout_mollie', data: {}}]
                }
            })

        await expect(callRoute()).rejects.toMatchObject({
            statusCode: 502,
            statusMessage: 'Payment provider did not return a redirect URL'
        })
    })
})
