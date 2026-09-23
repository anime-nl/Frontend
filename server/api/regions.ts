export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig(event)
    try {
        return await $fetch(`${config.medusaUrl}store/regions`, {
            headers: { 'x-publishable-api-key': config.medusaPublishableKey }
        })
    } catch (error) { return { regions: [] } }
})