import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {mockNuxtImport, mountSuspended, registerEndpoint} from '@nuxt/test-utils/runtime'
import {createError} from 'h3'
import LoginPage from '~/pages/account/login.vue'

const navigateToMock = vi.hoisted(() => vi.fn())
mockNuxtImport('navigateTo', () => navigateToMock)

let startShouldFail = false

registerEndpoint('/api/auth/google/start', {
    method: 'POST',
    handler: () => {
        if (startShouldFail) throw createError({statusCode: 500})
        return {location: 'https://accounts.google.com/o/oauth2/auth?client_id=abc'}
    }
})

const mountLogin = () => mountSuspended(LoginPage, {route: '/account/login'})

let wrapper: Awaited<ReturnType<typeof mountLogin>> | undefined

beforeEach(() => {
    startShouldFail = false
    navigateToMock.mockClear()
})

afterEach(() => {
    wrapper?.unmount()
})

describe('account login page', () => {
    it('shows a button to continue with Google, in the default (Dutch) locale', async () => {
        wrapper = await mountLogin()

        expect(wrapper.text()).toContain('Doorgaan met Google')
    })

    it('mentions that signing in is optional', async () => {
        wrapper = await mountLogin()

        expect(wrapper.text().toLowerCase()).toContain('gast')
    })

    it('starts the OAuth flow and follows the redirect', async () => {
        wrapper = await mountLogin()

        const button = wrapper.findComponent({name: 'UButton'})
        await button.trigger('click')

        await vi.waitFor(() =>
            expect(navigateToMock).toHaveBeenCalledWith('https://accounts.google.com/o/oauth2/auth?client_id=abc', {
                external: true
            })
        )
    })

    it('shows an error when starting sign-in fails', async () => {
        startShouldFail = true
        wrapper = await mountLogin()

        const button = wrapper.findComponent({name: 'UButton'})
        await button.trigger('click')

        await vi.waitFor(() => expect(wrapper!.text().toLowerCase()).toContain('kon niet'))
        expect(navigateToMock).not.toHaveBeenCalled()
    })
})
