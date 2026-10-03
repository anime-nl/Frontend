import {describe, expect, it} from 'vitest'
import {$fetch, fetch, setup} from '@nuxt/test-utils/e2e'

await setup({server: true})

describe('browser-language redirect', () => {
    it('redirects a first-time visitor whose browser prefers English to /en', async () => {
        const response = await fetch('/', {headers: {'accept-language': 'en-US,en;q=0.9'}, redirect: 'manual'})

        expect(response.status).toBe(302)
        expect(response.headers.get('location')).toBe('/en')
    })

    it('redirects a first-time visitor whose browser prefers German to /de', async () => {
        const response = await fetch('/', {headers: {'accept-language': 'de-DE,de;q=0.9'}, redirect: 'manual'})

        expect(response.status).toBe(302)
        expect(response.headers.get('location')).toBe('/de')
    })

    it('does not redirect a visitor whose browser prefers Dutch, the default locale', async () => {
        const response = await fetch('/', {headers: {'accept-language': 'nl-NL,nl;q=0.9'}, redirect: 'manual'})

        expect(response.status).toBe(200)
    })

    it('falls back to Dutch with no redirect when the browser sends no language preference', async () => {
        const response = await fetch('/', {redirect: 'manual'})

        expect(response.status).toBe(200)
    })
})

describe('i18n SEO tags', () => {
    it('sets the html lang attribute for the default (Dutch) locale', async () => {
        const html = await $fetch<string>('/support')

        expect(html).toContain('lang="nl-NL"')
    })

    it('sets the html lang attribute for an English-prefixed route', async () => {
        const html = await $fetch<string>('/en/support')

        expect(html).toContain('lang="en-GB"')
    })

    it('emits hreflang alternates for every locale plus x-default, pointing at the unprefixed Dutch URL', async () => {
        const html = await $fetch<string>('/support')

        expect(html).toContain('href="/support" hreflang="x-default"')
        expect(html).toContain('href="/support" hreflang="nl"')
        expect(html).toContain('href="/en/support" hreflang="en"')
        expect(html).toContain('href="/de/support" hreflang="de"')
    })

    it('emits a canonical link pointing at the current locale-specific URL', async () => {
        const nl = await $fetch<string>('/support')
        const en = await $fetch<string>('/en/support')

        expect(nl).toContain('rel="canonical" href="/support"')
        expect(en).toContain('rel="canonical" href="/en/support"')
    })
})
