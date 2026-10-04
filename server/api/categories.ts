import type {StoreProductCategoryListResponse} from '@medusajs/types'

const CACHE_TTL_MS = 5 * 60 * 1000

/**
 * GET /api/categories - lists the store's product categories. Cached briefly since categories are
 * fetched on nearly every page (every category page, search, the home page's region lookup chain)
 * and change rarely.
 * @returns The Medusa product category list, or an empty list if Medusa is unreachable
 */
export default defineEventHandler((event) =>
    withTtlCache('categories', CACHE_TTL_MS, () =>
        medusaFetch<StoreProductCategoryListResponse>(event, 'product-categories').catch(() => ({
            product_categories: []
        }))
    )
)
