import type {StoreProduct, StoreProductListResponse} from '@medusajs/types'
import type {H3Event} from 'h3'
import {
    matchesProductFilters,
    needsFullScan,
    parseProductFilters,
    sortByPrice,
    type ProductSort
} from '#shared/utils/productFilters'

const SCAN_PAGE_SIZE = 100
// Stock and price are only known per variant, so a filtered search needs these on top of what the page asked for
const SCAN_FIELDS = '+variants.inventory_quantity,+variants.manage_inventory,+variants.allow_backorder'
const MEDUSA_ORDER: Partial<Record<ProductSort, string>> = {newest: '-created_at', title: 'title'}
const OUR_PARAMS = ['min_price', 'max_price', 'in_stock', 'on_sale', 'sort']

/**
 * Fetches every product that matches a Medusa query, page after page.
 * @param event The incoming H3 event
 * @param query Medusa query params, without limit and offset
 * @returns All matching products
 */
async function fetchAllProducts(event: H3Event, query: Record<string, unknown>): Promise<StoreProduct[]> {
    const products: StoreProduct[] = []
    let count = Infinity

    while (products.length < count) {
        const page = await medusaFetch<StoreProductListResponse>(event, 'products', {
            query: {...query, limit: SCAN_PAGE_SIZE, offset: products.length}
        })
        if (page.products.length === 0) break
        products.push(...page.products)
        count = page.count
    }

    return products
}

/**
 * GET /api/products - lists products. Query params are forwarded to Medusa, except `min_price`, `max_price`,
 * `in_stock`, `on_sale` and `sort=price_asc|price_desc`, which Medusa cannot do and which are handled here.
 * @returns The Medusa product list (a page of the filtered list, with the filtered total as count)
 */
export default defineEventHandler(async (event) => {
    try {
        const query = getQuery(event)
        const {filters, sort} = parseProductFilters(query)
        const medusaQuery = Object.fromEntries(Object.entries(query).filter(([key]) => !OUR_PARAMS.includes(key)))
        const order = sort && MEDUSA_ORDER[sort]
        if (order) medusaQuery.order = order

        if (!needsFullScan(filters, sort)) {
            return await medusaFetch<StoreProductListResponse>(event, 'products', {query: medusaQuery})
        }

        const {limit, offset, fields, ...scanQuery} = medusaQuery
        const scanned = await fetchAllProducts(event, {
            ...scanQuery,
            fields: [fields, SCAN_FIELDS].filter(Boolean).join(',')
        })
        const matching = scanned.filter((product) => matchesProductFilters(product, filters))
        const priceDirection = sort === 'price_asc' ? 'asc' : sort === 'price_desc' ? 'desc' : undefined
        const sorted = priceDirection ? sortByPrice(matching, priceDirection) : matching
        const pageSize = Number(limit) || SCAN_PAGE_SIZE
        const start = Number(offset) || 0

        return {products: sorted.slice(start, start + pageSize), count: sorted.length, offset: start, limit: pageSize}
    } catch {
        throw createError({statusCode: 500, statusMessage: 'Could not fetch products'})
    }
})
