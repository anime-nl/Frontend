import type {StoreShippingOption} from '@medusajs/types'
import {CART_ID_COOKIE} from '../../utils/cart'

/**
 * GET /api/checkout/shipping-options - the shipping options available for the cart.
 * @returns The available shipping options
 */
export default defineEventHandler(async (event) => {
    const cartId = getCookie(event, CART_ID_COOKIE)
    if (!cartId) {
        throw createError({statusCode: 400, statusMessage: 'No cart'})
    }

    return medusaFetch<{shipping_options: StoreShippingOption[]}>(event, 'shipping-options', {
        query: {cart_id: cartId}
    })
})
