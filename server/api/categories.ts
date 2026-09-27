import type {StoreProductCategoryListResponse} from '@medusajs/types'

/**
 * GET /api/categories - lists the store's product categories.
 * @returns The Medusa product category list, or an empty list if Medusa is unreachable
 */
export default defineEventHandler((event) =>
    medusaFetch<StoreProductCategoryListResponse>(event, 'product-categories').catch(() => ({product_categories: []}))
)
