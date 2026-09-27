import type {StoreCart} from '@medusajs/types'
import {CART_FIELDS, CART_ID_COOKIE} from '../../utils/cart'

interface ShippingMethodBody {
    option_id?: string
}

export default defineEventHandler(async (event) => {
    const cartId = getCookie(event, CART_ID_COOKIE)
    if (!cartId) {
        throw createError({statusCode: 400, statusMessage: 'No cart'})
    }

    const body = (await readBody<ShippingMethodBody>(event)) ?? {}
    if (!body.option_id) {
        throw createError({statusCode: 400, statusMessage: 'Missing option_id'})
    }

    const {cart} = await medusaFetch<{cart: StoreCart}>(event, `carts/${cartId}/shipping-methods`, {
        method: 'POST',
        body: {option_id: body.option_id},
        query: {fields: CART_FIELDS}
    })

    return {cart}
})
