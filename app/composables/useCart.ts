import type {StoreCart} from '@medusajs/types'

/** The visitor's cart, identified server-side by the cart_id cookie. Shared across every consumer via the 'cart' key. */
export function useCart() {
    const {data, pending, refresh} = useFetch<{cart: StoreCart | null}>('/api/cart', {key: 'cart'})

    const cart = computed(() => data.value?.cart ?? null)
    const items = computed(() => cart.value?.items ?? [])
    const count = computed(() => items.value.reduce((sum, item) => sum + item.quantity, 0))

    const format = (amount: number) => {
        const currency = cart.value?.currency_code?.toUpperCase()
        return currency ? new Intl.NumberFormat('nl-NL', {style: 'currency', currency}).format(amount) : null
    }

    const subtotal = computed(() => (cart.value?.subtotal != null ? format(cart.value.subtotal) : null))
    const total = computed(() => (cart.value?.total != null ? format(cart.value.total) : null))

    async function addItem(variantId: string, quantity: number) {
        await $fetch('/api/cart/items', {method: 'POST', body: {variant_id: variantId, quantity}})
        await refresh()
    }

    async function updateItem(itemId: string, quantity: number) {
        await $fetch(`/api/cart/items/${itemId}`, {method: 'PUT', body: {quantity}})
        await refresh()
    }

    async function removeItem(itemId: string) {
        await $fetch(`/api/cart/items/${itemId}`, {method: 'DELETE'})
        await refresh()
    }

    return {cart, items, count, subtotal, total, format, pending, refresh, addItem, updateItem, removeItem}
}
