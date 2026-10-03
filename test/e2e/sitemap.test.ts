import {describe, expect, it} from 'vitest'
import {$fetch, setup} from '@nuxt/test-utils/e2e'

await setup({server: true})

describe('sitemap', () => {
    // With i18n configured, @nuxtjs/sitemap serves one sub-sitemap per locale instead of a single
    // flat urlset; /sitemap.xml becomes an index pointing at each of them.
    it('serves a sitemap index with one entry per locale', async () => {
        const xml = await $fetch<string>('/sitemap.xml')

        expect(xml).toContain('<sitemapindex')
        expect(xml).toContain('<loc>https://animenl.nl/__sitemap__/nl-NL.xml</loc>')
        expect(xml).toContain('<loc>https://animenl.nl/__sitemap__/en-GB.xml</loc>')
        expect(xml).toContain('<loc>https://animenl.nl/__sitemap__/de-DE.xml</loc>')
    })

    // No Medusa backend is available in this test environment, so this also covers the sitemap module
    // tolerating its /api/sitemap-urls source failing instead of crashing the whole sitemap.
    it('serves a valid sitemap of the static routes for the default locale', async () => {
        const xml = await $fetch<string>('/__sitemap__/nl-NL.xml')

        expect(xml).toContain('<urlset')
        expect(xml).toContain('<loc>https://animenl.nl/</loc>')
    })
})
