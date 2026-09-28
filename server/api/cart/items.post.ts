import type {H3Event} from 'h3'
import type {StoreCart, StoreRegion} from '@medusajs/types'
import {CART_COOKIE_OPTIONS, CART_FIELDS, CART_ID_COOKIE} from '../../utils/cart'

interface AddItemBody {
    variant_id?: string
    quantity?: number
}

async function getOrCreateCartId(event: H3Event): Promise<string> {
    const existing = getCookie(event, CART_ID_COOKIE)
    if (existing) return existing

    const config = useRuntimeConfig(event)
    const {regions} = await medusaFetch<{regions: StoreRegion[]}>(event, 'regions')
    const {cart} = await medusaFetch<{cart: StoreCart}>(event, 'carts', {
        method: 'POST',
        body: {region_id: regions[0]?.id, sales_channel_id: config.medusaSalesChannelId || undefined}
    })

    setCookie(event, CART_ID_COOKIE, cart.id, CART_COOKIE_OPTIONS)
    return cart.id
}

export default defineEventHandler(async (event) => {
    const body = (await readBody<AddItemBody>(event)) ?? {}

    if (!body.variant_id) {
        throw createError({statusCode: 400, statusMessage: 'Missing variant_id'})
    }
    if (!Number.isInteger(body.quantity) || body.quantity! < 1) {
        throw createError({statusCode: 400, statusMessage: 'quantity must be an integer of at least 1'})
    }

    try {
        const cartId = await getOrCreateCartId(event)

        const {cart} = await medusaFetch<{cart: StoreCart}>(event, `carts/${cartId}/line-items`, {
            method: 'POST',
            body: {variant_id: body.variant_id, quantity: body.quantity},
            query: {fields: CART_FIELDS}
        })

        return {cart}
    } catch {
        throw createError({statusCode: 500, statusMessage: 'Could not add item to cart'})
    }
})
