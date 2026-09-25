export default defineEventHandler((event) =>
    medusaFetch(event, 'product-categories').catch(() => ({product_categories: []}))
)
