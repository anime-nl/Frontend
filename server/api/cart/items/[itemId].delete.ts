import type {StoreCart} from '@medusajs/types'
import {CART_FIELDS, CART_ID_COOKIE} from '../../../utils/cart'

export default defineEventHandler(async (event) => {
    const cartId = getCookie(event, CART_ID_COOKIE)
    if (!cartId) {
        throw createError({statusCode: 400, statusMessage: 'No cart'})
    }

    const itemId = getRouterParam(event, 'itemId')

    // The delete response only confirms the removal, not the resulting cart, so fetch it fresh
    await medusaFetch(event, `carts/${cartId}/line-items/${itemId}`, {method: 'DELETE'})
    const {cart} = await medusaFetch<{cart: StoreCart}>(event, `carts/${cartId}`, {query: {fields: CART_FIELDS}})

    return {cart}
})
