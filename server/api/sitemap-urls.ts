import type {StoreProductListResponse} from '@medusajs/types'

const PAGE_SIZE = 100

/** Product URLs change as the Medusa catalog changes, so the sitemap module fetches them from here on demand. */
export default defineSitemapEventHandler(async (event) => {
    const urls: {loc: string; lastmod?: string}[] = []
    let offset = 0
    let count = Infinity

    while (offset < count) {
        const response = await medusaFetch<StoreProductListResponse>(event, 'products', {
            limit: PAGE_SIZE,
            offset,
            fields: 'id,updated_at'
        })

        for (const product of response.products) {
            urls.push({loc: `/product/${product.id}`, lastmod: product.updated_at ?? undefined})
        }

        count = response.count
        offset += PAGE_SIZE
    }

    return urls
})
