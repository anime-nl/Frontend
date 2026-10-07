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
