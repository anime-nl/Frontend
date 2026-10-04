import type {StoreProduct} from '@medusajs/types'

interface ProductResponse {
    product: StoreProduct
    region_id?: string
    sales_channel_id?: string
}

/**
 * Fetches a single product by id, with its calculated price for the store's default region.
 * @param id A getter for the product id, so the fetch re-keys if the route param changes
 * @returns Async data wrapping the product response
 */
export function useProduct(id: () => string) {
    return useFetch<ProductResponse>(() => `/api/products/${id()}`, {key: () => `product-${id()}`})
}
