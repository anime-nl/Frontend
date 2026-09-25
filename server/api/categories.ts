import type {StoreProductCategoryListResponse} from '@medusajs/types'

export default defineEventHandler((event) =>
    medusaFetch<StoreProductCategoryListResponse>(event, 'product-categories').catch(() => ({product_categories: []}))
)
