import type {StoreShippingOption} from '@medusajs/types'
import {CART_ID_COOKIE} from '../../utils/cart'

export default defineEventHandler(async (event) => {
    const cartId = getCookie(event, CART_ID_COOKIE)
    if (!cartId) {
        throw createError({statusCode: 400, statusMessage: 'No cart'})
    }

    return medusaFetch<{shipping_options: StoreShippingOption[]}>(event, 'shipping-options', {
        query: {cart_id: cartId}
    })
})
