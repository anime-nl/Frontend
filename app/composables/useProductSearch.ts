import type {StoreProduct} from '@medusajs/types'

export interface ProductListResponse {
    products: StoreProduct[]
    count: number
}

/**
 * Fetches a page of products from the catalog. Usable for an initial, SSR-rendered list; later
 * pages (infinite scroll, "load more") go through fetchProductPage instead, since useFetch's
 * reactive state and key-based deduping only make sense for the one fetch a component mounts with.
 * @param query Medusa query params (limit, offset, fields, region_id, filters, ...)
 * @param key A unique useFetch key for this list, so repeated mounts of the same component don't refetch
 * @returns Async data wrapping the product list and total count
 */
export function useProductSearch(query: Record<string, unknown>, key: string) {
    return useFetch<ProductListResponse>('/api/products', {key, query})
}

/**
 * Fetches one page of products imperatively, for client-driven pagination after an initial load.
 * @param query Medusa query params for this page
 * @returns The page of products and the catalog's total count
 */
export async function fetchProductPage(query: Record<string, unknown>): Promise<ProductListResponse> {
    return $fetch<ProductListResponse>('/api/products', {query})
}
