import type {StoreProductListResponse} from '@medusajs/types'

/**
 * GET /api/products - lists products, forwarding the request's query params to Medusa unchanged.
 * @returns The Medusa product list
 */
export default defineEventHandler(async (event) => {
    try {
        return await medusaFetch<StoreProductListResponse>(event, 'products', {query: getQuery(event)})
    } catch {
        throw createError({statusCode: 500, statusMessage: 'Could not fetch products'})
    }
})
