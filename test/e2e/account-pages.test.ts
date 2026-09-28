import {describe, expect, it} from 'vitest'
import {$fetch, fetch, setup} from '@nuxt/test-utils/e2e'

await setup({server: true})

describe('account pages', () => {
    it('/account/login renders sign-in buttons', async () => {
        const html = await $fetch<string>('/account/login')

        expect(html).toContain('Continue with Google')
    })

    it('/account prompts a first-time visitor to sign in', async () => {
        const html = await $fetch<string>('/account')

        expect(html).toContain('Sign in to see your account')
    })

    // No Medusa backend is available in this test environment, so this also covers /account
    // tolerating /api/account/me failing (a stale or unreachable session) instead of crashing.
    it('/account still renders when it has a session cookie but Medusa is unreachable', async () => {
        const html = await $fetch<string>('/account', {headers: {cookie: 'medusa_session=tok_fake'}})

        expect(html).toContain('Sign in to see your account')
    })

    // The sign-in exchange must happen from the browser, not during server-side rendering: an
    // internal SSR-to-SSR fetch never forwards the resulting session cookie to the real response
    // (see server/api/auth/[provider]/callback.post.ts), so completing it during SSR would sign
    // the visitor in on the server only and leave the browser without a session, looping forever.
    it('/account/callback/google does not attempt sign-in during server rendering', async () => {
        const response = await fetch('/account/callback/google?code=abc&state=xyz')
        const html = await response.text()

        expect(html).toContain('Signing you in')
        expect(html).not.toContain('Something went wrong signing you in')
        expect(response.headers.get('set-cookie')).toBeNull()
    })
})
