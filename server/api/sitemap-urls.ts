import type {StoreProductListResponse} from '@medusajs/types'

const PAGE_SIZE = 100

/**
 * Product URLs change as the Medusa catalog changes, so the sitemap module fetches them from here on demand.
 * @returns One sitemap entry per product, paginated through the full Medusa catalog
 */
export default defineSitemapEventHandler(async (event) => {
    const urls: {loc: string; lastmod?: string}[] = []
    let offset = 0
    let count = Infinity

    try {
        while (offset < count) {
            const response = await medusaFetch<StoreProductListResponse>(event, 'products', {
                query: {limit: PAGE_SIZE, offset, fields: 'id,updated_at'}
            })

            for (const product of response.products) {
                urls.push({loc: `/product/${product.id}`, lastmod: product.updated_at ?? undefined})
            }

            count = response.count
            offset += PAGE_SIZE
        }
    } catch {
        throw createError({statusCode: 500, statusMessage: 'Could not fetch products'})
    }

    return urls
})
