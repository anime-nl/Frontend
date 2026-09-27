import {describe, expect, it} from 'vitest'
import {$fetch, setup} from '@nuxt/test-utils/e2e'

await setup({server: true})

describe('sitemap', () => {
    // No Medusa backend is available in this test environment, so this also covers the sitemap module
    // tolerating its /api/sitemap-urls source failing instead of crashing the whole sitemap.
    it('serves a valid sitemap of the static routes', async () => {
        const xml = await $fetch<string>('/sitemap.xml')

        expect(xml).toContain('<urlset')
        expect(xml).toContain('<loc>https://animenl.nl/</loc>')
    })
})
