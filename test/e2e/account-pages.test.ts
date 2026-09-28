import {describe, expect, it} from 'vitest'
import {$fetch, setup} from '@nuxt/test-utils/e2e'

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

    it('/account/callback/google shows a sign-in error instead of crashing when Medusa is unreachable', async () => {
        const html = await $fetch<string>('/account/callback/google?code=abc&state=xyz')

        expect(html).toContain('Something went wrong signing you in')
    })
})
