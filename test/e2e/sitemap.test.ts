import {describe, expect, it} from 'vitest'
import {$fetch, setup} from '@nuxt/test-utils/e2e'

await setup({server: true})

describe('sitemap', () => {
    it('serves a valid sitemap that Medusa product URLs can be added to', async () => {
        const xml = await $fetch<string>('/sitemap.xml')

        expect(xml).toContain('<urlset')
        expect(xml).toContain('<loc>https://animenl.nl/</loc>')
    })

    it('fetches product URLs from Medusa without error', async () => {
        const urls = await $fetch<{loc: string}[]>('/api/sitemap-urls')

        expect(Array.isArray(urls)).toBe(true)
        for (const url of urls) {
            expect(url.loc).toMatch(/^\/product\//)
        }
    })
})
