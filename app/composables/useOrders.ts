import type {StoreOrder} from '@medusajs/types'

/**
 * The signed-in customer's recent orders.
 * @param enabled Whether to fetch now - skip while the customer isn't known to be signed in yet
 * @returns Async data wrapping the order list
 */
export function useOrders(enabled: boolean) {
    return useFetch<{orders: StoreOrder[]}>('/api/account/orders', {key: 'account-orders', immediate: enabled})
}
