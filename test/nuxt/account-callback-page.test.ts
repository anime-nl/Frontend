import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {mockNuxtImport, mountSuspended, registerEndpoint} from '@nuxt/test-utils/runtime'
import {createError, readBody} from 'h3'
import CallbackPage from '~/pages/account/callback/[provider].vue'

const navigateToMock = vi.hoisted(() => vi.fn())
mockNuxtImport('navigateTo', () => navigateToMock)

let callbackShouldFail = false
let lastCallbackQuery: unknown

registerEndpoint('/api/auth/google/callback', {
    method: 'POST',
    handler: async (event) => {
        lastCallbackQuery = await readBody(event)
        if (callbackShouldFail) throw createError({statusCode: 401})
        return {ok: true}
    }
})
registerEndpoint('/api/account/me', () => ({customer: {id: 'cus_1', email: 'jan@example.nl'}}))

const mountCallback = (route = '/account/callback/google?code=abc123&state=xyz') =>
    mountSuspended(CallbackPage, {route})

let wrapper: Awaited<ReturnType<typeof mountCallback>> | undefined

beforeEach(() => {
    callbackShouldFail = false
    lastCallbackQuery = undefined
    navigateToMock.mockClear()
})

afterEach(() => {
    wrapper?.unmount()
    document.cookie = 'i18n_redirected=; expires=Thu, 01 Jan 1970 00:00:00 GMT'
})

describe('account OAuth callback page', () => {
    it('posts the query params to the callback route and redirects to /account on success', async () => {
        wrapper = await mountCallback()

        await vi.waitFor(() => expect(navigateToMock).toHaveBeenCalledWith('/account'))
        expect(lastCallbackQuery).toEqual({code: 'abc123', state: 'xyz'})
    })

    it('redirects to the locale-prefixed /account on success when browsing a non-default locale', async () => {
        wrapper = await mountCallback('/en/account/callback/google?code=abc123&state=xyz')

        await vi.waitFor(() => expect(navigateToMock).toHaveBeenCalledWith('/en/account'))
    })

    // Google always redirects back to the fixed, unprefixed callback URL registered with the OAuth
    // app - it is never reached as /en/account/callback/... in real use, unlike the test above. The
    // visitor's locale from before they left for Google is only recoverable from the cookie
    // @nuxtjs/i18n already maintains.
    it('redirects to the locale-prefixed /account using the i18n_redirected cookie, since the callback URL itself is always unprefixed', async () => {
        document.cookie = 'i18n_redirected=en'
        wrapper = await mountCallback('/account/callback/google?code=abc123&state=xyz')

        await vi.waitFor(() => expect(navigateToMock).toHaveBeenCalledWith('/en/account'))
    })

    it('shows a retry link when sign-in fails', async () => {
        callbackShouldFail = true
        wrapper = await mountCallback()

        await vi.waitFor(() => expect(wrapper!.text().toLowerCase()).toContain('ging iets mis'))
        expect(wrapper.find('a[href="/account/login"]').exists()).toBe(true)
        expect(navigateToMock).not.toHaveBeenCalled()
    })
})
