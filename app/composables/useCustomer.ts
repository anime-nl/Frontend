import type {StoreCustomer} from '@medusajs/types'

/**
 * The signed-in customer, or null when signed out — /api/account/me answering 401 is not an error state.
 * @returns The current customer (or null), loading state and a refresh function
 */
export function useCustomer() {
    const {data, pending, refresh} = useFetch<{customer: StoreCustomer}>('/api/account/me', {key: 'current-customer'})
    const customer = computed(() => data.value?.customer ?? null)

    return {customer, pending, refresh}
}
