import {afterEach, describe, expect, it, vi} from 'vitest'
import {mountSuspended} from '@nuxt/test-utils/runtime'
import LocaleSwitcher from '~/components/localeSwitcher.vue'

const mountSwitcher = (route: string) => mountSuspended(LocaleSwitcher, {route, attachTo: document.body})

let wrapper: Awaited<ReturnType<typeof mountSwitcher>> | undefined

afterEach(() => {
    wrapper?.unmount()
})

describe('locale switcher', () => {
    it('shows the current locale name on the default (Dutch, unprefixed) route', async () => {
        wrapper = await mountSwitcher('/support')

        expect(wrapper.text()).toContain('Nederlands')
    })

    it('shows the current locale name on an English-prefixed route', async () => {
        wrapper = await mountSwitcher('/en/support')

        expect(wrapper.text()).toContain('English')
    })

    it('shows the current locale name on a German-prefixed route', async () => {
        wrapper = await mountSwitcher('/de/support')

        expect(wrapper.text()).toContain('Deutsch')
    })

    it('links to the English and German equivalents of the current unprefixed route', async () => {
        wrapper = await mountSwitcher('/support')

        await wrapper.find('button').trigger('click')

        await vi.waitFor(() => {
            expect(document.body.querySelector('a[href="/en/support"]')).toBeTruthy()
            expect(document.body.querySelector('a[href="/de/support"]')).toBeTruthy()
        })
    })

    it('links back to the unprefixed Dutch equivalent from an English-prefixed route', async () => {
        wrapper = await mountSwitcher('/en/support')

        await wrapper.find('button').trigger('click')

        await vi.waitFor(() => {
            expect(document.body.querySelector('a[href="/support"]')).toBeTruthy()
        })
    })
})
