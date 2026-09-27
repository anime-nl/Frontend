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

const mountCallback = () => mountSuspended(CallbackPage, {route: '/account/callback/google?code=abc123&state=xyz'})

let wrapper: Awaited<ReturnType<typeof mountCallback>> | undefined

beforeEach(() => {
    callbackShouldFail = false
    lastCallbackQuery = undefined
    navigateToMock.mockClear()
})

afterEach(() => {
    wrapper?.unmount()
})

describe('account OAuth callback page', () => {
    it('posts the query params to the callback route and redirects to /account on success', async () => {
        wrapper = await mountCallback()

        expect(lastCallbackQuery).toEqual({code: 'abc123', state: 'xyz'})
        expect(navigateToMock).toHaveBeenCalledWith('/account')
    })

    it('shows a retry link when sign-in fails', async () => {
        callbackShouldFail = true
        wrapper = await mountCallback()

        expect(wrapper.text().toLowerCase()).toContain('went wrong')
        expect(wrapper.find('a[href="/account/login"]').exists()).toBe(true)
        expect(navigateToMock).not.toHaveBeenCalled()
    })
})
