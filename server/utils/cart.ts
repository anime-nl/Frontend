import {isProductionEnv} from '#shared/utils/env'

export const CART_ID_COOKIE = 'cart_id'

export const CART_COOKIE_OPTIONS = {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: isProductionEnv(process.env.NODE_ENV),
    maxAge: 60 * 60 * 24 * 30,
    path: '/'
}

/** Requests everything the cart page and header badge need in one call. */
export const CART_FIELDS = '*items,*items.variant,+items.variant.calculated_price,*shipping_methods,*shipping_address'
