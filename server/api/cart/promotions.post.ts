import type {StoreCart} from '@medusajs/types'
import {CART_FIELDS, CART_ID_COOKIE} from '../../utils/cart'

interface PromotionBody {
    code?: string
}

/**
 * POST /api/cart/promotions - applies a promo code to the cart.
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
            method: 'POST',
            body: {promo_codes: [code]},
            query: {fields: CART_FIELDS}
        })
        return {cart}
    } catch (error) {
        const {statusCode, data} = error as {statusCode?: number; data?: {message?: string}}
        if (statusCode === 400) {
            // Medusa's own message is specific to the code/cart and can't be pre-translated; absent
            // that, tag the error with a stable code so the client can show a translated message
            // instead of this English fallback.
            throw createError({
                statusCode: 400,
                statusMessage: data?.message ?? 'That promo code is not valid',
                data: data?.message ? undefined : {code: 'invalidPromoCode'}
            })
        }
        throw createError({statusCode: 500, statusMessage: 'Could not apply promo code'})
    }
})
