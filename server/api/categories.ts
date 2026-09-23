export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig(event)
    try {
        return await $fetch(`${config.medusaUrl}store/product-categories`, {
            headers: { 'x-publishable-api-key': config.medusaPublishableKey }
        })
    } catch (error) { return { product_categories: [] } }
})