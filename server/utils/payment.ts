import type {StoreCart} from '@medusajs/types'

/** The provider id Medusa registers @variablevic/mollie-payments-medusa's hosted-checkout service under (module id `mollie` + provider identifier `mollie-hosted-checkout`, verified against a running dev Medusa; see docs/known-issues.md). */
export const MOLLIE_PROVIDER_ID = 'pp_mollie-hosted-checkout_mollie'

/** Mollie rejects payment metadata larger than 1 kB, so we stay a little below it. */
const MAX_METADATA_BYTES = 1000

/**
 * Builds the order details Mollie shows next to a payment: who is paying, where it ships and what was ordered.
 * Items that do not fit in Mollie's metadata limit are left out and only counted in `more_items`.
 * @param cart - The cart being paid, with its items and shipping address loaded
 * @returns The metadata object to store on the Mollie payment
 */
export function buildPaymentMetadata(cart: StoreCart) {
    const address = cart.shipping_address
    const metadata: Record<string, unknown> = {
        cart_id: cart.id,
        email: cart.email,
        name: [address?.first_name, address?.last_name].filter(Boolean).join(' '),
        phone: address?.phone,
        address: [address?.address_1, address?.postal_code, address?.city, address?.country_code?.toUpperCase()]
            .filter(Boolean)
            .join(', ')
    }

    const items = (cart.items ?? []).map((item) => ({title: item.product_title ?? item.title, quantity: item.quantity}))
    let fitting = items.length
    const withItems = (count: number) => ({
        ...metadata,
        items: items.slice(0, count),
        ...(count < items.length && {more_items: items.length - count})
    })
    while (fitting > 0 && Buffer.byteLength(JSON.stringify(withItems(fitting))) > MAX_METADATA_BYTES) {
        fitting--
    }
    return withItems(fitting)
}
