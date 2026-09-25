import type {StoreProductListResponse} from '@medusajs/types'

export default defineEventHandler(async (event) => {
    try {
        return await medusaFetch<StoreProductListResponse>(event, 'products', getQuery(event))
    } catch {
        throw createError({statusCode: 500, statusMessage: 'Could not fetch products'})
    }
})
