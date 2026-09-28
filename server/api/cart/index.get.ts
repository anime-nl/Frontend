import type {StoreCart} from '@medusajs/types'
import {CART_FIELDS, CART_ID_COOKIE} from '../../utils/cart'

/**
 * GET /api/cart - the visitor's cart, identified by the cart_id cookie.
 * @returns The cart, or null if there is no cart cookie or it points at a cart Medusa no longer has
 */
export default defineEventHandler(async (event) => {
    const cartId = getCookie(event, CART_ID_COOKIE)
    if (!cartId) return {cart: null}

    try {
        const {cart} = await medusaFetch<{cart: StoreCart}>(event, `carts/${cartId}`, {query: {fields: CART_FIELDS}})
        return {cart}
    } catch (error: any) {
        if (error?.statusCode === 404 || error?.response?.status === 404) {
            deleteCookie(event, CART_ID_COOKIE, {path: '/'})
            return {cart: null}
        }
        throw createError({statusCode: 500, statusMessage: 'Could not load cart'})
    }
})
