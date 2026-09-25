export default defineEventHandler(async (event) => {
    try {
        return await medusaFetch(event, 'products', getQuery(event))
    } catch {
        throw createError({statusCode: 500, statusMessage: 'Could not fetch products'})
    }
})
