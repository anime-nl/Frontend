import {describe, expect, it} from 'vitest'
import {$fetch, setup} from '@nuxt/test-utils/e2e'

await setup({server: true})

describe('checkout page', () => {
    it('redirects to /cart when there is no cart to check out, in the default (Dutch) locale', async () => {
        const html = await $fetch<string>('/checkout')

        expect(html).toContain('Je winkelwagen is leeg')
    })

    // No Medusa backend is available in this test environment, so this also covers the checkout page
    // tolerating /api/cart failing (a stale or unreachable cart) instead of crashing.
    it('still redirects gracefully when it has a cart_id cookie but Medusa is unreachable', async () => {
        const html = await $fetch<string>('/checkout', {headers: {cookie: 'cart_id=cart_fake'}})

        expect(html).toContain('Je winkelwagen is leeg')
    })
})
