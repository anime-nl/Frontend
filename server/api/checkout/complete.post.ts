import type {StoreCart, StoreOrder} from '@medusajs/types'
import {CART_ID_COOKIE} from '../../utils/cart'
import {signOrderId} from '../../utils/orderToken'
import {SESSION_COOKIE} from '../../utils/session'

/** Medusa's actual `carts/{id}/complete` response shape (not the `{type, data}` shorthand its docs use). */
interface CompleteCartResponse {
    type: 'order' | 'cart'
    order?: StoreOrder
    cart?: StoreCart
    error?: {type: string; name: string; message: string}
}

/** Mollie payment statuses that can never turn into a paid payment anymore. */
const FINAL_FAILED_MOLLIE_STATUSES = ['failed', 'canceled', 'expired']

/**
 * Reads the Mollie payment status out of the error Medusa returns when the Mollie plugin rejects an
 * unpaid payment during cart completion. The plugin throws "Payment is not authorized: current status
 * is <status>" and offers no other way to learn the status, so this is the only signal available
 * without giving the Nuxt server its own Mollie API key.
 * @param error Error thrown by the Medusa request
 * @returns The Mollie status named in the error message, or undefined if the message has none
 */
function mollieStatusFromError(error: unknown): string | undefined {
    const message = (error as {data?: {message?: unknown}}).data?.message
    if (typeof message !== 'string') return undefined

    return /current status is (\w+)/.exec(message)?.[1]
}

/**
 * POST /api/checkout/complete - completes the cart identified by the cart_id cookie after a Mollie
 * payment, turning it into an order. Mollie's redirect URL carries no cart id, so the cookie is the
 * only identifier available when the browser returns here. Safe to call repeatedly: Medusa returns the
 * existing order for a cart that is already completed, for example by Mollie's webhook.
 * @returns The order and a token for its order page on success, or a pending/failed status otherwise
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

        // No status code means Medusa never answered, which says nothing about the payment.
        if (!(error as {statusCode?: number}).statusCode) {
            throw createError({statusCode: 502, statusMessage: 'Could not complete order'})
        }

        // Only a payment Mollie has given up on is shown as failed; anything unclear stays pending so
        // a customer whose payment went through is never told it failed.
        const mollieStatus = mollieStatusFromError(error)
        const failed = mollieStatus !== undefined && FINAL_FAILED_MOLLIE_STATUSES.includes(mollieStatus)
        return {status: failed ? ('failed' as const) : ('pending' as const)}
    }

    if (response.type === 'order' && response.order) {
        deleteCookie(event, CART_ID_COOKIE, {path: '/'})

        const {orderLinkSecret} = useRuntimeConfig(event)
        return {
            status: 'completed' as const,
            order: response.order,
            ...(orderLinkSecret ? {token: signOrderId(response.order.id, orderLinkSecret)} : {})
        }
    }

    const status = response.error?.type === 'PAYMENT_REQUIRES_MORE_ERROR' ? ('pending' as const) : ('failed' as const)
    return {status, cart: response.cart}
})
