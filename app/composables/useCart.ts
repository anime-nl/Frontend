import type {StoreCart, StoreCartPromotion} from '@medusajs/types'
import {formatCurrency} from '#shared/utils/currency'

/**
 * The visitor's cart, identified server-side by the cart_id cookie. Shared across every consumer via the 'cart' key.
 * @returns Cart state and totals, plus addItem/updateItem/removeItem to mutate it
 */
export function useCart() {
    const {data, pending, refresh} = useFetch<{cart: StoreCart | null}>('/api/cart', {key: 'cart'})

    const cart = computed(() => data.value?.cart ?? null)
    const items = computed(() => cart.value?.items ?? [])
    const count = computed(() => items.value.reduce((sum, item) => sum + item.quantity, 0))

    const format = (amount: number) => {
        const currency = cart.value?.currency_code
        return currency ? formatCurrency(amount, currency) : null
    }

    const subtotal = computed(() => (cart.value?.subtotal != null ? format(cart.value.subtotal) : null))
    const total = computed(() => (cart.value?.total != null ? format(cart.value.total) : null))
    const taxTotal = computed(() => (cart.value?.tax_total != null ? format(cart.value.tax_total) : null))
    const discountTotal = computed(() => (cart.value?.discount_total ? format(cart.value.discount_total) : null))
    const subtotalInclTax = computed(() => (cart.value?.item_total != null ? format(cart.value.item_total) : null))
    const promotions = computed<StoreCartPromotion[]>(() => cart.value?.promotions ?? [])

    /**
     * Adds a variant to the cart, creating the cart cookie if there is none yet.
     * @param variantId Medusa variant id
     * @param quantity Number of units to add
     */
    async function addItem(variantId: string, quantity: number) {
        await $fetch('/api/cart/items', {method: 'POST', body: {variant_id: variantId, quantity}})
        await refresh()
    }

    /**
     * Sets a line item to an exact quantity.
     * @param itemId Cart line item id
     * @param quantity New quantity for the line item
     */
    async function updateItem(itemId: string, quantity: number) {
        await $fetch(`/api/cart/items/${itemId}`, {method: 'PUT', body: {quantity}})
        await refresh()
    }

    /**
     * Removes a line item from the cart entirely.
     * @param itemId Cart line item id
     */
    async function removeItem(itemId: string) {
        await $fetch(`/api/cart/items/${itemId}`, {method: 'DELETE'})
        await refresh()
    }

    /**
     * Applies a promo code to the cart.
     * @param code Promo code to apply
     */
    async function applyPromoCode(code: string) {
        await $fetch('/api/cart/promotions', {method: 'POST', body: {code}})
        await refresh()
    }

    /**
     * Removes an already-applied promo code from the cart.
     * @param code Promo code to remove
     */
    async function removePromoCode(code: string) {
        await $fetch('/api/cart/promotions', {method: 'DELETE', body: {code}})
        await refresh()
    }

    return {
        cart,
        items,
        count,
        subtotal,
        total,
        taxTotal,
        discountTotal,
        subtotalInclTax,
        promotions,
        format,
        pending,
        refresh,
        addItem,
        updateItem,
        removeItem,
        applyPromoCode,
        removePromoCode
    }
}
