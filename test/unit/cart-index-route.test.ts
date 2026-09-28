import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import type {H3Event} from 'h3'

const medusaFetch = vi.fn()
const getCookie = vi.fn()
const deleteCookie = vi.fn()

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
})

async function callRoute() {
    const {default: handler} = await import('../../server/api/cart/index.get')
    return (handler as (event: H3Event) => Promise<unknown>)({} as H3Event)
}

describe('GET /api/cart', () => {
    it('returns a null cart when there is no cart_id cookie', async () => {
        getCookie.mockReturnValue(undefined)

        await expect(callRoute()).resolves.toEqual({cart: null})
        expect(medusaFetch).not.toHaveBeenCalled()
    })

    it('returns the cart from Medusa when a cart_id cookie exists', async () => {
        getCookie.mockReturnValue('cart_1')
        medusaFetch.mockResolvedValue({cart: {id: 'cart_1', items: []}})

        await expect(callRoute()).resolves.toEqual({cart: {id: 'cart_1', items: []}})
        expect(medusaFetch).toHaveBeenCalledWith(expect.anything(), 'carts/cart_1', {
            query: {fields: expect.stringContaining('items')}
        })
    })

    it('clears the cookie and returns a null cart when Medusa no longer knows it', async () => {
        getCookie.mockReturnValue('cart_stale')
        medusaFetch.mockRejectedValue({statusCode: 404})

        await expect(callRoute()).resolves.toEqual({cart: null})
        expect(deleteCookie).toHaveBeenCalledWith(expect.anything(), 'cart_id', expect.anything())
    })

    it('answers 500 when Medusa fails for another reason', async () => {
        getCookie.mockReturnValue('cart_1')
        medusaFetch.mockRejectedValue(new Error('connect ECONNREFUSED'))

        await expect(callRoute()).rejects.toMatchObject({statusCode: 500, statusMessage: 'Could not load cart'})
    })
})
