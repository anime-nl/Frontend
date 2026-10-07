import type {StoreProduct, StoreProductCategory} from '@medusajs/types'

/**
 * Returns products in a given category, including the price. Top-level categories are product types, subcategories are Medusa categories.
 * @param handle Category handle (slug)
 * @returns List of products in the given category
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
        if (!typeId && !category) return []

        const {products} = await $fetch<{products: StoreProduct[]}>('/api/products', {
            query: {
                ...(typeId ? {type_id: [typeId]} : {category_id: withDescendantIds(categories, category!.id)}),
                region_id: regions[0]?.id,
                fields: 'title,thumbnail,*variants.calculated_price'
            }
        })
        return products
    })
}
