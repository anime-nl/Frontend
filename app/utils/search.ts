export interface SearchCategory {
    id: string
    handle: string
    name: string
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
