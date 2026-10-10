import type {StoreProductCategory} from '@medusajs/types'

export const CATEGORY_PAGE_SIZE = 12

export interface CategoryProducts extends ProductListResponse {
    query: Record<string, unknown>
}

/**
 * Returns the first page of products in a given category, including the price. Top-level categories are product types, subcategories are Medusa categories.
 * @param handle Category handle (slug)
 * @returns The first page, the category's total product count and the query to fetch further pages with
 */
export function useCategoryProducts(handle: string) {
    return useAsyncData(`category-products-${handle}`, async () => {
        const [{product_types: types}, {product_categories: categories}, {regions}] = await Promise.all([
            $fetch<{product_types: {id: string; value: string}[]}>('/api/product-types'),
            $fetch<{product_categories: StoreProductCategory[]}>('/api/categories'),
            $fetch<{regions: {id: string}[]}>('/api/regions')
        ])

        const typeId = findCategoryId(productTypesAsCategories(types), handle)
        const category = categories.find((c) => c.handle === handle)
        if (!typeId && !category) return {products: [], count: 0, query: {}}

        const query = {
            ...(typeId ? {type_id: [typeId]} : {category_id: withDescendantIds(categories, category!.id)}),
            region_id: regions[0]?.id,
            fields: 'title,thumbnail,*variants.calculated_price',
            limit: CATEGORY_PAGE_SIZE
        }
        const {products, count} = await fetchProductPage({...query, offset: 0})
        return {products, count, query}
    })
}
