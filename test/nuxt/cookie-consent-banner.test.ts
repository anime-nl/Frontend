import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {mockNuxtImport, mountSuspended} from '@nuxt/test-utils/runtime'
import CookieConsentBanner from '~/components/cookieConsentBanner.vue'

const gtagMock = vi.hoisted(() => vi.fn())
const initializeMock = vi.hoisted(() => vi.fn())
const useGtagMock = vi.hoisted(() => vi.fn(() => ({gtag: gtagMock, initialize: initializeMock})))
mockNuxtImport('useGtag', () => useGtagMock)

const mountBanner = (gaEnabled = true) => mountSuspended(CookieConsentBanner, {props: {gaEnabled}})

let wrapper: Awaited<ReturnType<typeof mountBanner>> | undefined

beforeEach(() => {
    localStorage.clear()
})

afterEach(() => {
    wrapper?.unmount()
    gtagMock.mockReset()
    initializeMock.mockReset()
})

async function clickButton(label: string) {
    const button = wrapper!.findAllComponents({name: 'UButton'}).find((b) => b.text() === label)
    await button!.trigger('click')
}

describe('cookie consent banner', () => {
    it('shows when analytics is enabled and no choice has been made yet', async () => {
        wrapper = await mountBanner()

        expect(wrapper.text().toLowerCase()).toContain('cookie')
    })

    it('does not show when this build has no Google Analytics configured', async () => {
        wrapper = await mountBanner(false)

        expect(wrapper.text()).toBe('')
    })

    it('does not show again once the visitor already declined', async () => {
        localStorage.setItem('cookie-consent', 'denied')
        wrapper = await mountBanner()

        expect(wrapper.text()).toBe('')
    })

    it('grants analytics consent and hides the banner when the visitor accepts', async () => {
        wrapper = await mountBanner()

        await clickButton('Accept')

        expect(initializeMock).toHaveBeenCalled()
        expect(gtagMock).toHaveBeenCalledWith(
            'consent',
            'update',
            expect.objectContaining({analytics_storage: 'granted'})
        )
        expect(localStorage.getItem('cookie-consent')).toBe('granted')
        expect(wrapper.text()).toBe('')
    })

    it('does not enable analytics and hides the banner when the visitor declines', async () => {
        wrapper = await mountBanner()

        await clickButton('Decline')

        expect(initializeMock).not.toHaveBeenCalled()
        expect(gtagMock).not.toHaveBeenCalled()
        expect(localStorage.getItem('cookie-consent')).toBe('denied')
        expect(wrapper.text()).toBe('')
    })

    it('re-initializes analytics on mount when the visitor previously granted consent', async () => {
        localStorage.setItem('cookie-consent', 'granted')
        wrapper = await mountBanner()

        expect(initializeMock).toHaveBeenCalled()
    })
})
