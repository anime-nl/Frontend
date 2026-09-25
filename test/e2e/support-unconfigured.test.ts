import {describe, expect, it} from 'vitest'
import {fetch, setup} from '@nuxt/test-utils/e2e'

await setup({
    server: true,
    nuxtConfig: {runtimeConfig: {smtpHost: ''}}
})

describe('POST /api/support without an SMTP server', () => {
    it('responds with 503 instead of pretending to send', async () => {
        const response = await fetch('/api/support', {
            method: 'POST',
            headers: {'content-type': 'application/json'},
            body: JSON.stringify({
                topic: 'payments',
                name: 'Jan',
                email: 'jan@example.nl',
                reason: 'My payment failed',
                message: 'Help'
            })
        })

        expect(response.status).toBe(503)
    })
})
