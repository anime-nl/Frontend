import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import type {H3Event} from 'h3'

const medusaFetch = vi.fn()
const getCookie = vi.fn()
const setCookie = vi.fn()
let provider: string
let body: unknown

function fakeJwt(payload: Record<string, unknown>): string {
    const base64url = (value: string) => Buffer.from(value).toString('base64url')
    return `${base64url('{"alg":"HS256"}')}.${base64url(JSON.stringify(payload))}.signature`
}

const existingCustomerToken = fakeJwt({actor_id: 'cus_1', user_metadata: {email: 'jan@example.nl'}})
const newIdentityToken = fakeJwt({actor_id: '', user_metadata: {email: 'jan@example.nl'}})
const refreshedToken = fakeJwt({actor_id: 'cus_2', user_metadata: {email: 'jan@example.nl'}})

beforeEach(() => {
    provider = 'google'
    body = {code: 'abc', state: 'xyz'}
    vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
    vi.stubGlobal('getRouterParam', () => provider)
    vi.stubGlobal('readBody', async () => body)
    vi.stubGlobal('createError', (input: object) => Object.assign(new Error(), input))
    vi.stubGlobal('medusaFetch', medusaFetch)
    vi.stubGlobal('getCookie', getCookie)
    vi.stubGlobal('setCookie', setCookie)
})

afterEach(() => {
    vi.unstubAllGlobals()
    medusaFetch.mockReset()
    getCookie.mockReset()
    setCookie.mockReset()
})

async function callRoute() {
    const {default: handler} = await import('../../server/api/auth/[provider]/callback.post')
    return (handler as (event: H3Event) => Promise<unknown>)({} as H3Event)
}

describe('POST /api/auth/:provider/callback', () => {
    it('rejects an unknown provider', async () => {
        provider = 'facebook'

        await expect(callRoute()).rejects.toMatchObject({statusCode: 400})
        expect(medusaFetch).not.toHaveBeenCalled()
    })

    it('answers 401 when Medusa rejects the callback', async () => {
        getCookie.mockReturnValue(undefined)
        medusaFetch.mockRejectedValue(new Error('invalid state'))

        await expect(callRoute()).rejects.toMatchObject({statusCode: 401})
    })

    it('signs in an existing customer without creating one', async () => {
        getCookie.mockReturnValue(undefined)
        medusaFetch.mockResolvedValue({token: existingCustomerToken})

        await expect(callRoute()).resolves.toEqual({ok: true})

        expect(medusaFetch).toHaveBeenCalledTimes(1)
        expect(medusaFetch).toHaveBeenCalledWith(expect.anything(), 'customer/google/callback', {
            method: 'POST',
            base: 'auth',
            query: body
        })
        expect(setCookie).toHaveBeenCalledWith(
            expect.anything(),
            'medusa_session',
            existingCustomerToken,
            expect.anything()
        )
    })

    it('creates the customer and refreshes the token for a first-time sign-in', async () => {
        getCookie.mockReturnValue(undefined)
        medusaFetch
            .mockResolvedValueOnce({token: newIdentityToken})
            .mockResolvedValueOnce({customer: {id: 'cus_2'}})
            .mockResolvedValueOnce({token: refreshedToken})

        await expect(callRoute()).resolves.toEqual({ok: true})

        expect(medusaFetch).toHaveBeenNthCalledWith(2, expect.anything(), 'customers', {
            method: 'POST',
            token: newIdentityToken,
            body: {email: 'jan@example.nl'}
        })
        expect(medusaFetch).toHaveBeenNthCalledWith(3, expect.anything(), 'token/refresh', {
            method: 'POST',
            base: 'auth',
            token: newIdentityToken
        })
        expect(setCookie).toHaveBeenCalledWith(expect.anything(), 'medusa_session', refreshedToken, expect.anything())
    })

    it('transfers a guest cart to the signed-in customer', async () => {
        getCookie.mockReturnValue('cart_1')
        medusaFetch.mockResolvedValueOnce({token: existingCustomerToken}).mockResolvedValueOnce({cart: {id: 'cart_1'}})

        await callRoute()

        expect(medusaFetch).toHaveBeenNthCalledWith(2, expect.anything(), 'carts/cart_1/customer', {
            method: 'POST',
            token: existingCustomerToken
        })
    })

    it('does not fail sign-in when the cart transfer fails', async () => {
        getCookie.mockReturnValue('cart_1')
        medusaFetch.mockResolvedValueOnce({token: existingCustomerToken}).mockRejectedValueOnce(new Error('down'))

        await expect(callRoute()).resolves.toEqual({ok: true})
    })
})
