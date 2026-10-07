import type {StoreProduct, StoreProductCategory} from '@medusajs/types'

/**
 * Returns products in a given category, including the price
 * @param handle Category handle (slug)
 * @returns List of products in the given category
 */
export function useCategoryProducts(handle: string) {
    return useAsyncData(`category-products-${handle}`, async () => {
        const [{product_categories: categories}, {regions}] = await Promise.all([
            $fetch<{product_categories: StoreProductCategory[]}>('/api/categories'),
            $fetch<{regions: {id: string}[]}>('/api/regions')
        ])

        const category = categories.find((c) => c.handle === handle)
        if (!category) return []

        const {products} = await $fetch<{products: StoreProduct[]}>('/api/products', {
            query: {
                category_id: withDescendantIds(categories, category.id),
                region_id: regions[0]?.id,
                fields: 'title,thumbnail,*variants.calculated_price'
            }
        })
        return products
    })
}
