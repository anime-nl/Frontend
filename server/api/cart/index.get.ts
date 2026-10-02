import type {StoreCart} from '@medusajs/types'
import {CART_FIELDS, CART_ID_COOKIE} from '../../utils/cart'

/**
 * GET /api/cart - the visitor's cart, identified by the cart_id cookie.
 * @returns The cart, or null if there is no cart cookie, it points at a cart Medusa no longer has,
 *   or that cart has already been completed into an order
 */
export default defineEventHandler(async (event) => {
    const cartId = getCookie(event, CART_ID_COOKIE)
    if (!cartId) return {cart: null}

    try {
        const {cart} = await medusaFetch<{cart: StoreCart}>(event, `carts/${cartId}`, {query: {fields: CART_FIELDS}})

        // A completed cart keeps existing in Medusa, attached to its order, so it must be treated
        // the same as a gone cart - otherwise a visitor returning from checkout keeps seeing their
        // old, now-completed cart until the cookie happens to expire or get overwritten.
        if (cart.completed_at) {
            deleteCookie(event, CART_ID_COOKIE, {path: '/'})
            return {cart: null}
        }

        return {cart}
    } catch (error) {
        const {statusCode, response} = error as {statusCode?: number; response?: {status?: number}}
        if (statusCode === 404 || response?.status === 404) {
            deleteCookie(event, CART_ID_COOKIE, {path: '/'})
            return {cart: null}
        }
        throw createError({statusCode: 500, statusMessage: 'Could not load cart'})
    }
})
