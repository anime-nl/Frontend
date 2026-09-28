import type {H3Event} from 'h3'
import type {StoreCart, StoreRegion} from '@medusajs/types'
import {CART_COOKIE_OPTIONS, CART_FIELDS, CART_ID_COOKIE} from '../../utils/cart'

interface AddItemBody {
    variant_id?: string
    quantity?: number
}

/**
 * Creates a new guest cart, storing its id in the cart cookie.
 * @param event The incoming H3 event, used to read runtime config and set the cart cookie
 * @returns The newly created cart's id
 */
async function createCart(event: H3Event): Promise<string> {
    const config = useRuntimeConfig(event)
    const {regions} = await medusaFetch<{regions: StoreRegion[]}>(event, 'regions')
    const {cart} = await medusaFetch<{cart: StoreCart}>(event, 'carts', {
        method: 'POST',
        body: {region_id: regions[0]?.id, sales_channel_id: config.medusaSalesChannelId || undefined}
    })

    setCookie(event, CART_ID_COOKIE, cart.id, CART_COOKIE_OPTIONS)
    return cart.id
}

/**
 * Adds a variant to an existing cart in Medusa.
 * @param event The incoming H3 event, used to reach Medusa
 * @param cartId Id of the cart to add the line item to
 * @param body Variant and quantity to add
 * @returns The updated cart
 */
async function addLineItem(event: H3Event, cartId: string, body: AddItemBody): Promise<StoreCart> {
    const {cart} = await medusaFetch<{cart: StoreCart}>(event, `carts/${cartId}/line-items`, {
        method: 'POST',
        body: {variant_id: body.variant_id, quantity: body.quantity},
        query: {fields: CART_FIELDS}
    })
    return cart
}

/**
 * POST /api/cart/items - adds a variant to the cart, creating the cart if there is none yet.
 * @returns The updated cart
 */
export default defineEventHandler(async (event) => {
    const body = (await readBody<AddItemBody>(event)) ?? {}

    if (!body.variant_id) {
        throw createError({statusCode: 400, statusMessage: 'Missing variant_id'})
    }
    if (!Number.isInteger(body.quantity) || body.quantity! < 1) {
        throw createError({statusCode: 400, statusMessage: 'quantity must be an integer of at least 1'})
    }

    try {
        const existingCartId = getCookie(event, CART_ID_COOKIE)

        if (existingCartId) {
            try {
                return {cart: await addLineItem(event, existingCartId, body)}
            } catch (error) {
                // The cart cookie can outlive its cart, for example after a database reset; fall
                // through and create a fresh cart instead of failing forever on a dead cart id.
                if ((error as {statusCode?: number}).statusCode !== 404) throw error
            }
        }

        const cartId = await createCart(event)
        return {cart: await addLineItem(event, cartId, body)}
    } catch {
        throw createError({statusCode: 500, statusMessage: 'Could not add item to cart'})
    }
})
