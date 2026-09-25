export default defineEventHandler((event) =>
    medusaFetch(event, 'regions').catch(() => ({regions: []}))
)
