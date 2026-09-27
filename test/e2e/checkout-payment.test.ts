import {describe, expect, it} from 'vitest'
import {$fetch, fetch, setup} from '@nuxt/test-utils/e2e'

await setup({server: true})

describe('POST /api/checkout/payment-session', () => {
    it('responds with 400 when there is no cart', async () => {
        const response = await fetch('/api/checkout/payment-session', {method: 'POST'})

        expect(response.status).toBe(400)
    })

    // No Medusa backend is available in this test environment, so a cart_id cookie pointing at an
    // unreachable Medusa must fail with a normal HTTP error instead of crashing the server.
    it('fails gracefully instead of crashing when Medusa is unreachable', async () => {
        const response = await fetch('/api/checkout/payment-session', {
            method: 'POST',
            headers: {cookie: 'cart_id=cart_fake'}
        })

        expect(response.status).toBeGreaterThanOrEqual(400)
    })
})

describe('POST /api/checkout/complete', () => {
    it('responds with 400 when there is no cart', async () => {
        const response = await fetch('/api/checkout/complete', {method: 'POST'})

        expect(response.status).toBe(400)
    })
})

describe('checkout return page', () => {
    it('renders the failed state gracefully when there is no cart', async () => {
        const html = await $fetch<string>('/checkout/return')

        expect(html).toContain('Payment failed')
    })

    // No Medusa backend is available in this test environment, so this also covers the return page
    // tolerating /api/checkout/complete failing (a stale or unreachable cart) instead of crashing.
    it('renders the failed state gracefully when Medusa is unreachable', async () => {
        const html = await $fetch<string>('/checkout/return', {headers: {cookie: 'cart_id=cart_fake'}})

        expect(html).toContain('Payment failed')
    })
})
