import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import type {H3Event} from 'h3'

const medusaFetch = vi.fn()
const getCookie = vi.fn()
let body: unknown

const validBody = {
    email: 'jan@example.nl',
    firstName: 'Jan',
    lastName: 'Jansen',
    street: 'Kerkstraat',
    houseNumber: '12',
    postalCode: '1234 AB',
    city: 'Amsterdam',
    country: 'NL'
}

beforeEach(() => {
    body = validBody
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
    const {default: handler} = await import('../../server/api/checkout/address.post')
    return (handler as (event: H3Event) => Promise<unknown>)({} as H3Event)
}

describe('POST /api/checkout/address', () => {
    it('requires an existing cart', async () => {
        getCookie.mockReturnValue(undefined)

        await expect(callRoute()).rejects.toMatchObject({statusCode: 400, statusMessage: 'No cart'})
        expect(medusaFetch).not.toHaveBeenCalled()
    })

    it('rejects an invalid address', async () => {
        getCookie.mockReturnValue('cart_1')
        body = {...validBody, firstName: ''}

        await expect(callRoute()).rejects.toMatchObject({statusCode: 400, statusMessage: 'Invalid address'})
        expect(medusaFetch).not.toHaveBeenCalled()
    })

    it('sets the shipping and billing address on the cart', async () => {
        getCookie.mockReturnValue('cart_1')
        medusaFetch.mockResolvedValue({cart: {id: 'cart_1', email: validBody.email}})

        await expect(callRoute()).resolves.toEqual({cart: {id: 'cart_1', email: validBody.email}})

        const expectedAddress = {
            first_name: 'Jan',
            last_name: 'Jansen',
            address_1: 'Kerkstraat 12',
            city: 'Amsterdam',
            postal_code: '1234 AB',
            country_code: 'nl'
        }
        expect(medusaFetch).toHaveBeenCalledWith(expect.anything(), 'carts/cart_1', {
            method: 'POST',
            body: {email: 'jan@example.nl', shipping_address: expectedAddress, billing_address: expectedAddress},
            query: {fields: expect.stringContaining('shipping_address')}
        })
    })
})
