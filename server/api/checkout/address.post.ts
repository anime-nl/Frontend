import type {StoreCart} from '@medusajs/types'
import {addressLine1, normalizeAddressRequest, validateAddressRequest} from '#shared/utils/checkout'
import {CART_FIELDS, CART_ID_COOKIE} from '../../utils/cart'

export default defineEventHandler(async (event) => {
    const cartId = getCookie(event, CART_ID_COOKIE)
    if (!cartId) {
        throw createError({statusCode: 400, statusMessage: 'No cart'})
    }

    const request = normalizeAddressRequest(await readBody(event))
    const errors = validateAddressRequest(request)
    if (errors.length) {
        throw createError({statusCode: 400, statusMessage: 'Invalid address', data: errors})
    }

    const address = {
        first_name: request.firstName,
        last_name: request.lastName,
        address_1: addressLine1(request.street, request.houseNumber),
        city: request.city,
        postal_code: request.postalCode,
        country_code: request.country.toLowerCase()
    }

    const {cart} = await medusaFetch<{cart: StoreCart}>(event, `carts/${cartId}`, {
        method: 'POST',
        body: {email: request.email, shipping_address: address, billing_address: address},
        query: {fields: CART_FIELDS}
    })

    return {cart}
})
