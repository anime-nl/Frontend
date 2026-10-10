export type ProductSort = 'newest' | 'title' | 'price_asc' | 'price_desc'

export interface ProductFilters {
    minPrice?: number
    maxPrice?: number
    inStock?: boolean
    onSale?: boolean
}

export interface FilterableProduct {
    variants?:
        | {
              calculated_price?: {calculated_amount?: number | null; original_amount?: number | null} | null
              inventory_quantity?: number | null
              manage_inventory?: boolean | null
              allow_backorder?: boolean | null
          }[]
        | null
}

const SORTS: ProductSort[] = ['newest', 'title', 'price_asc', 'price_desc']

/**
 * Medusa's store API can neither filter nor sort on price or stock, so those are done by us.
 * @param filters The parsed filters
 * @param sort The chosen sort order
 * @returns Whether the products have to be filtered and sorted by us instead of by Medusa
 */
export const needsFullScan = (filters: ProductFilters, sort?: ProductSort) =>
    filters.minPrice !== undefined ||
    filters.maxPrice !== undefined ||
    Boolean(filters.inStock) ||
    Boolean(filters.onSale) ||
    sort === 'price_asc' ||
    sort === 'price_desc'

/**
 * Reads the filter and sort params of a search request. Invalid values are ignored rather than rejected,
 * so a hand-edited URL still shows results.
 * @param query The request's query params
 * @returns The filters and sort order that were present and valid
 */
export function parseProductFilters(query: Record<string, unknown>): {filters: ProductFilters; sort?: ProductSort} {
    const price = (value: unknown) => {
        const amount = typeof value === 'string' && value.trim() !== '' ? Number(value) : NaN
        return Number.isFinite(amount) && amount >= 0 ? amount : undefined
    }
    const sort = SORTS.find((candidate) => candidate === query.sort)

    return {
        filters: {
            minPrice: price(query.min_price),
            maxPrice: price(query.max_price),
            inStock: query.in_stock === 'true',
            onSale: query.on_sale === 'true'
        },
        sort
    }
}

/**
 * @param product A product with its variants' calculated prices
 * @returns The cheapest variant price, or null when no variant has a price
 */
export function lowestPrice(product: FilterableProduct): number | null {
    const amounts = (product.variants ?? []).flatMap((variant) => {
        const amount = variant.calculated_price?.calculated_amount
        return amount == null ? [] : [amount]
    })
    return amounts.length > 0 ? Math.min(...amounts) : null
}

/**
 * @param product A product with its variants' stock fields
 * @returns Whether a customer can order at least one variant right now
 */
export const isInStock = (product: FilterableProduct) =>
    (product.variants ?? []).some(
        (variant) =>
            variant.manage_inventory === false || variant.allow_backorder || (variant.inventory_quantity ?? 0) > 0
    )

/**
 * @param product A product with its variants' calculated prices
 * @returns Whether at least one variant is currently priced below its regular price
 */
export const isOnSale = (product: FilterableProduct) =>
    (product.variants ?? []).some((variant) => {
        const {calculated_amount: current, original_amount: original} = variant.calculated_price ?? {}
        return current != null && original != null && current < original
    })

/**
 * @param product The product to check
 * @param filters The active filters
 * @returns Whether the product passes every active filter. A product without a price never passes a price filter.
 */
export function matchesProductFilters(product: FilterableProduct, filters: ProductFilters): boolean {
    const price = lowestPrice(product)
    if (filters.minPrice !== undefined && (price === null || price < filters.minPrice)) return false
    if (filters.maxPrice !== undefined && (price === null || price > filters.maxPrice)) return false
    if (filters.inStock && !isInStock(product)) return false
    if (filters.onSale && !isOnSale(product)) return false
    return true
}

/**
 * @param products The products to sort
 * @param direction Which end to put the cheapest products at
 * @returns A new array sorted by lowest price. Products without a price go last in either direction.
 */
export function sortByPrice<T extends FilterableProduct>(products: T[], direction: 'asc' | 'desc'): T[] {
    const factor = direction === 'asc' ? 1 : -1
    return [...products].sort((a, b) => {
        const priceA = lowestPrice(a)
        const priceB = lowestPrice(b)
        if (priceA === null || priceB === null) return Number(priceA === null) - Number(priceB === null)
        return (priceA - priceB) * factor
    })
}
