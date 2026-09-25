export default defineEventHandler((event) =>
    medusaFetch(event, 'collections').catch(() => ({collections: []}))
)
