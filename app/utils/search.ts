import type {ProductSort} from '#shared/utils/productFilters'

export interface SearchCategory {
    id: string
    handle: string
    name: string
    parent_category_id?: string | null
}

/**
 * Opens the search page with the category of a navbar section selected and the collection (series) dropdown focused.
 * @param categoryHandle Handle of the category to preselect
 * @returns URL to the search page
 */
export const bySeriesLink = (categoryHandle: string) => `/search?category=${categoryHandle}&focus=collection`

/**
 * The search page accepts a category as either its id or its handle.
 * @param categories Categories to search
 * @param idOrHandle Category id or handle to resolve
 * @returns The matching category's id, or an empty string if none matches
 */
export const findCategoryId = (categories: SearchCategory[], idOrHandle: string) =>
    categories.find((category) => category.id === idOrHandle || category.handle === idOrHandle)?.id ?? ''

/**
 * Medusa only returns a product for the categories it is directly assigned to, so filtering on a top-level
 * category such as "tcg" would miss products that are only in one of its subcategories.
 * @param categories All categories
 * @param id Id of the category to expand
 * @returns The category's id followed by the ids of all its descendants
 */
export function withDescendantIds(categories: SearchCategory[], id: string): string[] {
    const children = categories.filter((category) => category.parent_category_id === id)
    return [id, ...children.flatMap((child) => withDescendantIds(categories, child.id))]
}

/**
 * The shop's top-level categories are Medusa product types, because production has no product categories.
 * The navbar links to them by handle, so each type value is turned into one (production's "Plushies" is the nav's "plush").
 * @param types Product types as returned by /api/product-types
 * @returns The types shaped like categories, so they can be resolved with findCategoryId
 */
export const productTypesAsCategories = (types: {id: string; value: string}[]): SearchCategory[] =>
    types.map((type) => {
        const handle = type.value.toLowerCase()
        return {id: type.id, handle: handle === 'plushies' ? 'plush' : handle, name: type.value}
    })

/**
 * Lists the categories for the search page's category dropdown, each subcategory right below its parent and
 * labelled with the path to it, so "Singles" under "TCG" shows as "TCG › Singles".
 * @param categories All categories
 * @param parentId Id of the category whose children to list, or null for the top level
 * @param prefix Label of the parent, already followed by the separator
 * @returns The dropdown options, depth first
 */
export function categoryOptions(
    categories: SearchCategory[],
    parentId: string | null = null,
    prefix = ''
): {id: string; label: string}[] {
    return categories
        .filter((category) => (category.parent_category_id ?? null) === parentId)
        .flatMap((category) => [
            {id: category.id, label: prefix + category.name},
            ...categoryOptions(categories, category.id, `${prefix}${category.name} › `)
        ])
}

/**
 * @param days How many days back to look
 * @param now The current time, overridable for tests
 * @returns The ISO timestamp that many days before now, as used for Medusa's created_at filter
 */
export const daysAgoIso = (days: number, now = new Date()) =>
    new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString()

export interface SearchFilters {
    q: string
    category: string
    collection: string
    minPrice: string | number
    maxPrice: string | number
    addedWithinDays: string
    inStock: boolean
    onSale: boolean
    sort: ProductSort | ''
}

export const ADDED_WITHIN_DAYS = ['7', '30', '90']
export const SORTS: ProductSort[] = ['newest', 'title', 'price_asc', 'price_desc']

export const EMPTY_FILTERS: SearchFilters = {
    q: '',
    category: '',
    collection: '',
    minPrice: '',
    maxPrice: '',
    addedWithinDays: '',
    inStock: false,
    onSale: false,
    sort: ''
}

/**
 * @param value A query param, which vue-router gives as a string, an array when repeated, or nothing
 * @returns The first value, or an empty string
 */
const firstValue = (value: unknown): string => String((Array.isArray(value) ? value[0] : value) ?? '')

/**
 * @param value A price typed in the URL
 * @returns The value if it is a non-negative number, otherwise an empty string
 */
const validPrice = (value: unknown): string => {
    const text = firstValue(value)
    return text !== '' && Number.isFinite(Number(text)) && Number(text) >= 0 ? text : ''
}

/**
 * Reads the search filters from the URL, so a shared or reloaded link shows the same search.
 * Anything missing or invalid falls back to the unfiltered default.
 * @param query The route's query params
 * @param categories All categories, to resolve a category handle or id
 * @returns The filters the URL describes
 */
export function queryToFilters(query: Record<string, unknown>, categories: SearchCategory[]): SearchFilters {
    const added = firstValue(query.added)
    const sort = firstValue(query.sort)

    return {
        q: firstValue(query.q),
        category: findCategoryId(categories, firstValue(query.category)),
        collection: firstValue(query.collection),
        minPrice: validPrice(query.min_price),
        maxPrice: validPrice(query.max_price),
        addedWithinDays: ADDED_WITHIN_DAYS.includes(added) ? added : '',
        inStock: firstValue(query.in_stock) === 'true',
        onSale: firstValue(query.on_sale) === 'true',
        sort: SORTS.find((candidate) => candidate === sort) ?? ''
    }
}

/**
 * Describes the search filters as URL query params, leaving out every filter that is not set so the
 * URL of an unfiltered search stays clean. The category is written as its handle, which reads better than an id.
 * @param filters The current filters
 * @param categories All categories, to look up the handle
 * @returns The query params for the URL
 */
export function filtersToQuery(filters: SearchFilters, categories: SearchCategory[]): Record<string, string> {
    const category = categories.find((candidate) => candidate.id === filters.category)?.handle
    const params: Record<string, string> = {
        q: filters.q.trim(),
        category: category ?? '',
        collection: filters.collection,
        min_price: String(filters.minPrice ?? ''),
        max_price: String(filters.maxPrice ?? ''),
        added: filters.addedWithinDays,
        in_stock: filters.inStock ? 'true' : '',
        on_sale: filters.onSale ? 'true' : '',
        sort: filters.sort
    }
    return Object.fromEntries(Object.entries(params).filter(([, value]) => value !== ''))
}
