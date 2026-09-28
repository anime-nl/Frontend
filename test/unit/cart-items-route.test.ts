import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import type {H3Event} from 'h3'

const medusaFetch = vi.fn()
const getCookie = vi.fn()
const setCookie = vi.fn()
let body: unknown

beforeEach(() => {
    body = {variant_id: 'variant_1', quantity: 1}
    vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
    vi.stubGlobal('useRuntimeConfig', () => ({medusaSalesChannelId: 'sc_1'}))
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
    const {default: handler} = await import('../../server/api/cart/items.post')
    return (handler as (event: H3Event) => Promise<unknown>)({} as H3Event)
}

describe('POST /api/cart/items', () => {
    it('creates a cart and sets the cookie on the first add-to-cart', async () => {
        getCookie.mockReturnValue(undefined)
        medusaFetch
            .mockResolvedValueOnce({regions: [{id: 'reg_nl'}]})
            .mockResolvedValueOnce({cart: {id: 'cart_1'}})
            .mockResolvedValueOnce({cart: {id: 'cart_1', items: [{id: 'item_1'}]}})

        await expect(callRoute()).resolves.toEqual({cart: {id: 'cart_1', items: [{id: 'item_1'}]}})

        expect(medusaFetch).toHaveBeenNthCalledWith(2, expect.anything(), 'carts', {
            method: 'POST',
            body: {region_id: 'reg_nl', sales_channel_id: 'sc_1'}
        })
        expect(medusaFetch).toHaveBeenNthCalledWith(3, expect.anything(), 'carts/cart_1/line-items', {
            method: 'POST',
            body: {variant_id: 'variant_1', quantity: 1},
            query: {fields: expect.stringContaining('items')}
        })
        expect(setCookie).toHaveBeenCalledWith(expect.anything(), 'cart_id', 'cart_1', expect.anything())
    })

    it('adds to the existing cart without creating a new one', async () => {
        getCookie.mockReturnValue('cart_1')
        medusaFetch.mockResolvedValue({cart: {id: 'cart_1', items: [{id: 'item_1'}]}})

        await expect(callRoute()).resolves.toEqual({cart: {id: 'cart_1', items: [{id: 'item_1'}]}})

        expect(medusaFetch).toHaveBeenCalledTimes(1)
        expect(medusaFetch).toHaveBeenCalledWith(expect.anything(), 'carts/cart_1/line-items', {
            method: 'POST',
            body: {variant_id: 'variant_1', quantity: 1},
            query: {fields: expect.stringContaining('items')}
        })
        expect(setCookie).not.toHaveBeenCalled()
    })

    it('rejects a quantity below 1', async () => {
        getCookie.mockReturnValue('cart_1')
        body = {variant_id: 'variant_1', quantity: 0}

        await expect(callRoute()).rejects.toMatchObject({statusCode: 400})
        expect(medusaFetch).not.toHaveBeenCalled()
    })

    it('rejects a non-integer quantity', async () => {
        getCookie.mockReturnValue('cart_1')
        body = {variant_id: 'variant_1', quantity: 1.5}

        await expect(callRoute()).rejects.toMatchObject({statusCode: 400})
    })

    it('rejects a missing variant_id', async () => {
        getCookie.mockReturnValue('cart_1')
        body = {quantity: 1}

        await expect(callRoute()).rejects.toMatchObject({statusCode: 400})
    })

    it('rejects an empty request body', async () => {
        getCookie.mockReturnValue('cart_1')
        body = undefined

        await expect(callRoute()).rejects.toMatchObject({statusCode: 400})
        expect(medusaFetch).not.toHaveBeenCalled()
    })

    it('fails gracefully when Medusa is unreachable while creating a cart', async () => {
        getCookie.mockReturnValue(undefined)
        medusaFetch.mockRejectedValue(new Error('fetch failed'))

        await expect(callRoute()).rejects.toMatchObject({statusCode: 500})
        expect(setCookie).not.toHaveBeenCalled()
    })

    it('fails gracefully when Medusa is unreachable while adding to an existing cart', async () => {
        getCookie.mockReturnValue('cart_1')
        medusaFetch.mockRejectedValue(new Error('fetch failed'))

        await expect(callRoute()).rejects.toMatchObject({statusCode: 500})
    })

    it('creates a new cart when the cookie points at a cart Medusa no longer has', async () => {
        getCookie.mockReturnValue('cart_1')
        const cartNotFound = Object.assign(new Error('Cart id not found'), {statusCode: 404})
        medusaFetch
            .mockRejectedValueOnce(cartNotFound)
            .mockResolvedValueOnce({regions: [{id: 'reg_nl'}]})
            .mockResolvedValueOnce({cart: {id: 'cart_2'}})
            .mockResolvedValueOnce({cart: {id: 'cart_2', items: [{id: 'item_1'}]}})

        await expect(callRoute()).resolves.toEqual({cart: {id: 'cart_2', items: [{id: 'item_1'}]}})

        expect(medusaFetch).toHaveBeenNthCalledWith(1, expect.anything(), 'carts/cart_1/line-items', {
            method: 'POST',
            body: {variant_id: 'variant_1', quantity: 1},
            query: {fields: expect.stringContaining('items')}
        })
        expect(medusaFetch).toHaveBeenNthCalledWith(4, expect.anything(), 'carts/cart_2/line-items', {
            method: 'POST',
            body: {variant_id: 'variant_1', quantity: 1},
            query: {fields: expect.stringContaining('items')}
        })
        expect(setCookie).toHaveBeenCalledWith(expect.anything(), 'cart_id', 'cart_2', expect.anything())
    })
})
