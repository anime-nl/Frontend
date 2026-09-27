import {describe, expect, it} from 'vitest'
import {$fetch, fetch, setup} from '@nuxt/test-utils/e2e'

await setup({server: true})

describe('favicon', () => {
    it('links the full-resolution icon and the apple touch icon in the page head', async () => {
        const html = await $fetch<string>('/')

        expect(html).toContain('<link rel="icon" href="/favicon.ico" sizes="48x48">')
        expect(html).toContain('<link rel="icon" type="image/png" href="/icon.png" sizes="1024x1024">')
        expect(html).toContain('<link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180">')
    })

    it('serves the icon files', async () => {
        for (const path of ['/favicon.ico', '/icon.png', '/apple-touch-icon.png']) {
            const response = await fetch(path)
            expect(response.status, path).toBe(200)
        }
    })
})
