export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig(event)
    try {
        return await $fetch(`${config.medusaUrl}store/collections`, {
            headers: { 'x-publishable-api-key': config.medusaPublishableKey }
        })
    } catch (error) { return { collections: [] } }
})