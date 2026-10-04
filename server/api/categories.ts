import type {StoreProductCategoryListResponse} from '@medusajs/types'

const CACHE_TTL_MS = 5 * 60 * 1000

/**
 * GET /api/categories - lists the store's product categories. Cached briefly since every category
 * page (via useCategoryProducts) and the search page's category filter fetch this, and the
 * category list rarely changes.
 * @returns The Medusa product category list, or an empty list if Medusa is unreachable
 */
export default defineEventHandler((event) =>
    withTtlCache('categories', CACHE_TTL_MS, () =>
        medusaFetch<StoreProductCategoryListResponse>(event, 'product-categories')
    ).catch(() => ({product_categories: []}))
)
