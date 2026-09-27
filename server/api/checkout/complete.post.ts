import type {StoreCart, StoreOrder} from '@medusajs/types'
import {CART_ID_COOKIE} from '../../utils/cart'
import {SESSION_COOKIE} from '../../utils/session'

/** Medusa's actual `carts/{id}/complete` response shape (not the `{type, data}` shorthand its docs use). */
interface CompleteCartResponse {
    type: 'order' | 'cart'
    order?: StoreOrder
    cart?: StoreCart
    error?: {type: string; name: string; message: string}
}

/**
 * POST /api/checkout/complete - completes the cart identified by the cart_id cookie after a Mollie
 * payment, turning it into an order. Mollie's redirect URL carries no cart id, so the cookie is the
 * only identifier available when the browser returns here.
 * @returns The resulting order on success, or the cart with a pending/failed status otherwise
 */
export default defineEventHandler(async (event) => {
    const cartId = getCookie(event, CART_ID_COOKIE)
    if (!cartId) {
        throw createError({statusCode: 400, statusMessage: 'No cart'})
    }

    const token = getCookie(event, SESSION_COOKIE)

    let response: CompleteCartResponse
    try {
        response = await medusaFetch<CompleteCartResponse>(event, `carts/${cartId}/complete`, {
            method: 'POST',
            ...(token ? {token} : {})
        })
    } catch (error) {
        console.error('Could not complete cart:', error)
        throw createError({statusCode: 502, statusMessage: 'Could not complete order'})
    }

    if (response.type === 'order' && response.order) {
        deleteCookie(event, CART_ID_COOKIE, {path: '/'})
        return {status: 'completed' as const, order: response.order}
    }

    const status = response.error?.type === 'PAYMENT_REQUIRES_MORE_ERROR' ? ('pending' as const) : ('failed' as const)
    return {status, cart: response.cart}
})
