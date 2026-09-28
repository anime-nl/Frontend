import type {StoreShippingOption} from '@medusajs/types'
import {CART_ID_COOKIE} from '../../utils/cart'

interface CartItemProductId {
    product_id: string
}

interface ProductShippingProfile {
    product_id: string
    shipping_profile_id: string | null
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
        medusaFetch<{cart: {items: CartItemProductId[]}}>(event, `carts/${cartId}`, {
            query: {fields: 'items.product_id'}
        }),
        medusaFetch<{shipping_options: StoreShippingOption[]}>(event, 'shipping-options', {
            query: {cart_id: cartId}
        })
    ])

    // The Store API never exposes a product's shipping_profile (not even the id), so it comes
    // from a dedicated Medusa route instead of the cart/product endpoints' field allowlists.
    const productIds = [...new Set(cart.items.map((item) => item.product_id))]
    const itemProfileIds = productIds.length
        ? (
              await medusaFetch<{shipping_profiles: ProductShippingProfile[]}>(event, 'products/shipping-profiles', {
                  query: {id: productIds}
              })
          ).shipping_profiles
              .map((profile) => profile.shipping_profile_id)
              .filter((id): id is string => id !== null)
        : []

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
