import type {StoreCart} from '@medusajs/types'
import {CART_ID_COOKIE} from '../../utils/cart'
import {MOLLIE_PROVIDER_ID} from '../../utils/payment'

/** The subset of a Medusa payment session this route reads. `data` is the Mollie plugin's own response shape, which Medusa does not type. */
interface PaymentSession {
    provider_id: string
    data?: {_links?: {checkout?: {href?: string}}}
}

/**
 * POST /api/checkout/payment-session - starts a Mollie payment session for the cart and returns
 * the hosted checkout URL to redirect the browser to.
 * @returns The Mollie checkout redirect URL
 */
export default defineEventHandler(async (event) => {
    const cartId = getCookie(event, CART_ID_COOKIE)
    if (!cartId) {
        throw createError({statusCode: 400, statusMessage: 'No cart'})
    }

    const {cart} = await medusaFetch<{cart: StoreCart}>(event, `carts/${cartId}`, {
        query: {fields: '*shipping_methods'}
    })
    if (!cart.shipping_methods?.length) {
        throw createError({statusCode: 400, statusMessage: 'Cart has no shipping method'})
    }

    let session: PaymentSession | undefined
    try {
        const {payment_collection} = await medusaFetch<{payment_collection: {id: string}}>(
            event,
            'payment-collections',
            {
                method: 'POST',
                body: {cart_id: cartId}
            }
        )

        const {
            payment_collection: {payment_sessions}
        } = await medusaFetch<{payment_collection: {payment_sessions: PaymentSession[]}}>(
            event,
            `payment-collections/${payment_collection.id}/payment-sessions`,
            {method: 'POST', body: {provider_id: MOLLIE_PROVIDER_ID}}
        )
        session = payment_sessions.find((candidate) => candidate.provider_id === MOLLIE_PROVIDER_ID)
    } catch (error) {
        console.error('Could not create a Mollie payment session:', error)
        throw createError({statusCode: 502, statusMessage: 'Could not start payment'})
    }

    const redirectUrl = session?.data?._links?.checkout?.href
    if (!redirectUrl) {
        console.error('Mollie payment session did not include a checkout redirect URL:', session)
        throw createError({statusCode: 502, statusMessage: 'Payment provider did not return a redirect URL'})
    }

    return {redirect_url: redirectUrl}
})
