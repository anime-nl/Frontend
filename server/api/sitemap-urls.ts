import type {StoreProductListResponse} from '@medusajs/types'

const PAGE_SIZE = 100

// Mirrors nuxt.config.ts's i18n.locales: prefix_except_default means nl has no URL prefix.
// The language tag here must match each locale's configured `language`, since @nuxtjs/sitemap
// derives both its per-locale sub-sitemap name and its hreflang value from that tag.
const LOCALES = [
    {prefix: '', languageTag: 'nl-NL'},
    {prefix: '/en', languageTag: 'en-GB'},
    {prefix: '/de', languageTag: 'de-DE'}
] as const

/**
 * Product URLs change as the Medusa catalog changes, so the sitemap module fetches them from here on
 * demand. Emits one entry per product per locale, cross-linked via `alternatives` for hreflang - the
 * sitemap module's automatic i18n fan-out only covers statically-defined pages, not this dynamic source.
 * @returns One sitemap entry per product per locale, paginated through the full Medusa catalog
 */
export default defineSitemapEventHandler(async (event) => {
    const urls: {loc: string; lastmod?: string; _sitemap: string; alternatives: {hreflang: string; href: string}[]}[] =
        []
    let offset = 0
    let count = Infinity

    try {
        while (offset < count) {
            const response = await medusaFetch<StoreProductListResponse>(event, 'products', {
                query: {limit: PAGE_SIZE, offset, fields: 'id,updated_at'}
            })

            for (const product of response.products) {
                const alternatives = LOCALES.map(({prefix, languageTag}) => ({
                    hreflang: languageTag,
                    href: `${prefix}/product/${product.id}`
                }))

                for (const {prefix, languageTag} of LOCALES) {
                    urls.push({
                        loc: `${prefix}/product/${product.id}`,
                        lastmod: product.updated_at ?? undefined,
                        _sitemap: languageTag,
                        alternatives
                    })
                }
            }

            count = response.count
            offset += PAGE_SIZE
        }
    } catch {
        throw createError({statusCode: 500, statusMessage: 'Could not fetch products'})
    }

    return urls
})
