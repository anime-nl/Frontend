import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {mountSuspended, registerEndpoint} from '@nuxt/test-utils/runtime'
import Navbar from '~/components/navbar.vue'

let cart: {items: {quantity: number}[]} | null = null
registerEndpoint('/api/cart', () => ({cart}))

const mountNavbar = () => mountSuspended(Navbar, {attachTo: document.body})

let wrapper: Awaited<ReturnType<typeof mountNavbar>> | undefined

beforeEach(() => {
    cart = null
})

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

    it('links the cart icon to the cart page', async () => {
        wrapper = await mountNavbar()

        const link = wrapper.find('a[href="/cart"]')
        expect(link.exists()).toBe(true)
    })

    it('shows the total item count on the cart badge', async () => {
        cart = {items: [{quantity: 2}, {quantity: 1}]}
        wrapper = await mountNavbar()

        await vi.waitFor(() => expect(wrapper!.text()).toContain('3'))
    })

    it('hides the badge when the cart is empty', async () => {
        cart = {items: []}
        wrapper = await mountNavbar()

        await vi.waitFor(() => expect(wrapper!.findComponent({name: 'UChip'}).props('show')).toBe(false))
    })
})
