export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig(event)
    const query = getQuery(event)

    try {
        const response = await $fetch(`${config.medusaUrl}store/products`, {
            headers: {
                'x-publishable-api-key': config.medusaPublishableKey
            },
            query: query
        })
        return response
    } catch (error) {
        throw createError({ statusCode: 500, statusMessage: 'Could not fetch products' })
    }
})