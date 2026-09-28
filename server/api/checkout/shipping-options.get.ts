import type {StoreShippingOption} from '@medusajs/types'
import {CART_ID_COOKIE} from '../../utils/cart'

interface CartItemShippingProfile {
    product: {shipping_profile: {id: string}}
}

/**
 * Determines which shipping profile's options to show for a cart: Pakket if any line item needs
 * it (a Pakket parcel can carry Brievenbus-sized items too, but not the other way round), else
 * Brievenbus if every item fits it, else `undefined` for a profile the site does not recognize
 * yet, in which case every option is shown unfiltered rather than hiding all of them.
 * @param itemProfileIds The shipping profile id of each cart line item's product
 * @param brievenbusProfileId The configured Brievenbus shipping profile id
 * @param pakketProfileId The configured Pakket shipping profile id
 * @returns The winning profile id, or undefined if none of the item profiles are recognized
 */
function resolveShippingProfileId(
    itemProfileIds: string[],
    brievenbusProfileId: string,
    pakketProfileId: string
): string | undefined {
    if (itemProfileIds.includes(pakketProfileId)) return pakketProfileId
    if (itemProfileIds.every((id) => id === brievenbusProfileId)) return brievenbusProfileId
    return undefined
}

/**
 * GET /api/checkout/shipping-options - the shipping options for the cart, limited to the
 * Brievenbus or Pakket shipping profile the cart's items require.
 * @returns The available shipping options
 */
export default defineEventHandler(async (event) => {
    const cartId = getCookie(event, CART_ID_COOKIE)
    if (!cartId) {
        throw createError({statusCode: 400, statusMessage: 'No cart'})
    }

    const config = useRuntimeConfig(event)
    const [{cart}, {shipping_options: shippingOptions}] = await Promise.all([
        medusaFetch<{cart: {items: CartItemShippingProfile[]}}>(event, `carts/${cartId}`, {
            query: {fields: '*items.product.shipping_profile'}
        }),
        medusaFetch<{shipping_options: StoreShippingOption[]}>(event, 'shipping-options', {
            query: {cart_id: cartId}
        })
    ])

    const itemProfileIds = cart.items.map((item) => item.product.shipping_profile.id)
    const profileId = resolveShippingProfileId(
        itemProfileIds,
        config.medusaBrievenbusShippingProfileId,
        config.medusaPakketShippingProfileId
    )

    return {
        shipping_options: profileId
            ? shippingOptions.filter((option) => option.shipping_profile_id === profileId)
            : shippingOptions
    }
})
