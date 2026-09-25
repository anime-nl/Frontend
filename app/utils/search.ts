export interface SearchCategory {
    id: string
    handle: string
    name: string
}

/** Opens the search page with the category of a navbar section selected and the collection (series) dropdown focused */
export const bySeriesLink = (categoryHandle: string) => `/search?category=${categoryHandle}&focus=collection`

/** The search page accepts a category as either its id or its handle */
export const findCategoryId = (categories: SearchCategory[], idOrHandle: string) =>
    categories.find((category) => category.id === idOrHandle || category.handle === idOrHandle)?.id ?? ''
