import {describe, expect, it} from 'vitest'
import {$fetch, fetch, setup} from '@nuxt/test-utils/e2e'

// Matches server/utils/session.ts's SESSION_COOKIE; not imported directly since that module also
// pulls in '#shared/utils/env', an alias the e2e vitest project doesn't configure.
const SESSION_COOKIE = 'medusa_session'

await setup({server: true})

describe('account pages', () => {
    it('/account/login renders sign-in buttons, in the default (Dutch) locale', async () => {
        const html = await $fetch<string>('/account/login')

        expect(html).toContain('Doorgaan met Google')
    })

    it('/account prompts a first-time visitor to sign in, in the default (Dutch) locale', async () => {
        const html = await $fetch<string>('/account')

        expect(html).toContain('Log in om je account')
    })

    // No Medusa backend is available in this test environment, so this also covers /account
    // tolerating /api/account/me failing (a stale or unreachable session) instead of crashing.
    it('/account still renders when it has a session cookie but Medusa is unreachable', async () => {
        const html = await $fetch<string>('/account', {headers: {cookie: 'medusa_session=tok_fake'}})

        expect(html).toContain('Log in om je account')
    })

    // The sign-in exchange must happen from the browser, not during server-side rendering: an
    // internal SSR-to-SSR fetch never forwards the resulting session cookie to the real response
    // (see server/api/auth/[provider]/callback.post.ts), so completing it during SSR would sign
    // the visitor in on the server only and leave the browser without a session, looping forever.
    it('/account/callback/google does not attempt sign-in during server rendering', async () => {
        const response = await fetch('/account/callback/google?code=abc&state=xyz')
        const html = await response.text()

        expect(html).toContain('wordt ingelogd')
        expect(html).not.toContain('ging iets mis bij het inloggen')
        // The i18n module sets its own locale-detection cookie on every response; only a session
        // cookie here would mean a sign-in was (wrongly) attempted during SSR.
        expect(response.headers.get('set-cookie')).not.toContain(SESSION_COOKIE)
    })
})
