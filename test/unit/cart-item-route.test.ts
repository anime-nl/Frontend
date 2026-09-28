import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import type {H3Event} from 'h3'

const medusaFetch = vi.fn()
const getCookie = vi.fn()
let body: unknown

beforeEach(() => {
    body = {quantity: 2}
    vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
    vi.stubGlobal('getRouterParam', () => 'item_1')
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

async function callPutRoute() {
    const {default: handler} = await import('../../server/api/cart/items/[itemId].put')
    return (handler as (event: H3Event) => Promise<unknown>)({} as H3Event)
}

async function callDeleteRoute() {
    const {default: handler} = await import('../../server/api/cart/items/[itemId].delete')
    return (handler as (event: H3Event) => Promise<unknown>)({} as H3Event)
}

describe('PUT /api/cart/items/:itemId', () => {
    it('updates the line item quantity on the existing cart', async () => {
        getCookie.mockReturnValue('cart_1')
        medusaFetch.mockResolvedValue({cart: {id: 'cart_1', items: [{id: 'item_1', quantity: 2}]}})

        await expect(callPutRoute()).resolves.toEqual({cart: {id: 'cart_1', items: [{id: 'item_1', quantity: 2}]}})
        expect(medusaFetch).toHaveBeenCalledWith(expect.anything(), 'carts/cart_1/line-items/item_1', {
            method: 'POST',
            body: {quantity: 2},
            query: {fields: expect.stringContaining('items')}
        })
    })

    it('rejects a quantity below 1', async () => {
        getCookie.mockReturnValue('cart_1')
        body = {quantity: 0}

        await expect(callPutRoute()).rejects.toMatchObject({statusCode: 400})
        expect(medusaFetch).not.toHaveBeenCalled()
    })

    it('requires an existing cart', async () => {
        getCookie.mockReturnValue(undefined)

        await expect(callPutRoute()).rejects.toMatchObject({statusCode: 400, statusMessage: 'No cart'})
        expect(medusaFetch).not.toHaveBeenCalled()
    })

    it('rejects an empty request body', async () => {
        getCookie.mockReturnValue('cart_1')
        body = undefined

        await expect(callPutRoute()).rejects.toMatchObject({statusCode: 400})
        expect(medusaFetch).not.toHaveBeenCalled()
    })
})

describe('DELETE /api/cart/items/:itemId', () => {
    it('removes the line item and returns the refreshed cart', async () => {
        getCookie.mockReturnValue('cart_1')
        medusaFetch
            .mockResolvedValueOnce({id: 'item_1', object: 'line-item', deleted: true})
            .mockResolvedValueOnce({cart: {id: 'cart_1', items: []}})

        await expect(callDeleteRoute()).resolves.toEqual({cart: {id: 'cart_1', items: []}})
        expect(medusaFetch).toHaveBeenNthCalledWith(1, expect.anything(), 'carts/cart_1/line-items/item_1', {
            method: 'DELETE'
        })
        expect(medusaFetch).toHaveBeenNthCalledWith(2, expect.anything(), 'carts/cart_1', {
            query: {fields: expect.stringContaining('items')}
        })
    })

    it('requires an existing cart', async () => {
        getCookie.mockReturnValue(undefined)

        await expect(callDeleteRoute()).rejects.toMatchObject({statusCode: 400, statusMessage: 'No cart'})
        expect(medusaFetch).not.toHaveBeenCalled()
    })
})
