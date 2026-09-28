import {describe, expect, it} from 'vitest'
import {$fetch, setup} from '@nuxt/test-utils/e2e'

await setup({server: true})

describe('cart page', () => {
    it('shows the empty-cart state for a first-time visitor', async () => {
        const html = await $fetch<string>('/cart')

        expect(html).toContain('Your cart is empty')
    })

    // No Medusa backend is available in this test environment, so this also covers the cart page
    // tolerating /api/cart failing (a stale or unreachable cart) instead of crashing.
    it('still renders when it has a cart_id cookie but Medusa is unreachable', async () => {
        const html = await $fetch<string>('/cart', {headers: {cookie: 'cart_id=cart_fake'}})

        expect(html).toContain('Your cart')
    })
})
