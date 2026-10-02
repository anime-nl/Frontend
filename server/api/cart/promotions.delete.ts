import type {StoreCart} from '@medusajs/types'
import {CART_FIELDS, CART_ID_COOKIE} from '../../utils/cart'

interface PromotionBody {
    code?: string
}

/**
 * DELETE /api/cart/promotions - removes a promo code from the cart.
 * @returns The updated cart
 */
export default defineEventHandler(async (event) => {
    const cartId = getCookie(event, CART_ID_COOKIE)
    if (!cartId) {
        throw createError({statusCode: 400, statusMessage: 'No cart'})
    }

    const body = (await readBody<PromotionBody>(event)) ?? {}
    const code = body.code?.trim()
    if (!code) {
        throw createError({statusCode: 400, statusMessage: 'Missing code'})
    }

    try {
        const {cart} = await medusaFetch<{cart: StoreCart}>(event, `carts/${cartId}/promotions`, {
            method: 'DELETE',
            body: {promo_codes: [code]},
            query: {fields: CART_FIELDS}
        })
        return {cart}
    } catch {
        throw createError({statusCode: 500, statusMessage: 'Could not remove promo code'})
    }
})
