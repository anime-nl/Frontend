import type {StoreProductTypeListResponse} from '@medusajs/types'

const CACHE_TTL_MS = 5 * 60 * 1000

/**
 * GET /api/product-types - lists the store's product types, which the shop uses as its top-level
 * categories (Figures, Plushies, ...). Cached briefly since every category page and the search page fetch it.
 * @returns The Medusa product type list, or an empty list if Medusa is unreachable
 */
export default defineEventHandler((event) =>
    withTtlCache('product-types', CACHE_TTL_MS, () =>
        medusaFetch<StoreProductTypeListResponse>(event, 'product-types', {query: {fields: 'id,value'}})
    ).catch(() => ({product_types: []}))
)
