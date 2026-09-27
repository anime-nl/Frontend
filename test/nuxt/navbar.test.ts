import {afterEach, describe, expect, it, vi} from 'vitest'
import {mountSuspended} from '@nuxt/test-utils/runtime'
import Navbar from '~/components/navbar.vue'

const mountNavbar = () => mountSuspended(Navbar, {attachTo: document.body})

let wrapper: Awaited<ReturnType<typeof mountNavbar>> | undefined

afterEach(() => {
    wrapper?.unmount()
})

describe('navbar', () => {
    it('links to the support page', async () => {
        wrapper = await mountNavbar()

        const link = wrapper.find('a[href="/support"]')
        expect(link.exists()).toBe(true)
        expect(link.text()).toBe('Support')
    })

    it('shows the Trustpilot score', async () => {
        wrapper = await mountNavbar()

        expect(wrapper.text()).toContain('4.0')
    })

    it('opens a mobile menu with the same links when the menu button is clicked', async () => {
        wrapper = await mountNavbar()

        expect(document.body.querySelectorAll('a[href="/support"]')).toHaveLength(1)

        await wrapper.find('button[aria-label="Open menu"]').trigger('click')
        await vi.waitFor(() => {
            expect(document.body.querySelectorAll('a[href="/support"]').length).toBeGreaterThan(1)
        })
    })
})
