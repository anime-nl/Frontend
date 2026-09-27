import type {StoreCart} from '@medusajs/types'
import {CART_FIELDS, CART_ID_COOKIE} from '../../../utils/cart'

export default defineEventHandler(async (event) => {
    const cartId = getCookie(event, CART_ID_COOKIE)
    if (!cartId) {
        throw createError({statusCode: 400, statusMessage: 'No cart'})
    }

    const itemId = getRouterParam(event, 'itemId')
    const {quantity} = await readBody<{quantity?: number}>(event)

    if (!Number.isInteger(quantity) || quantity! < 1) {
        throw createError({statusCode: 400, statusMessage: 'quantity must be an integer of at least 1'})
    }

    const {cart} = await medusaFetch<{cart: StoreCart}>(event, `carts/${cartId}/line-items/${itemId}`, {
        method: 'POST',
        body: {quantity},
        query: {fields: CART_FIELDS}
    })

    return {cart}
})
