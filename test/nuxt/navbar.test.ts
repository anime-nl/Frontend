import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {mountSuspended, registerEndpoint} from '@nuxt/test-utils/runtime'
import {createError} from 'h3'
import Navbar from '~/components/navbar.vue'

let cart: {items: {quantity: number}[]} | null = null
registerEndpoint('/api/cart', () => ({cart}))

let customer: {email: string; first_name?: string} | null = null
registerEndpoint('/api/account/me', () => {
    if (!customer) throw createError({statusCode: 401})
    return {customer}
})

const mountNavbar = () => mountSuspended(Navbar, {attachTo: document.body})

let wrapper: Awaited<ReturnType<typeof mountNavbar>> | undefined

beforeEach(() => {
    cart = null
    customer = null
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

        await wrapper.find('button[aria-label="Menu openen"]').trigger('click')
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

    // Nuxt UI's Chip size scale is built for tiny status dots (its largest built-in size is only a
    // 12px box), so a legible count badge needs a larger size than the component's own default.
    it('renders the cart badge large enough to read a count', async () => {
        wrapper = await mountNavbar()

        expect(wrapper.findComponent({name: 'UChip'}).props('size')).toBe('3xl')
    })

    it('shows a log in link when signed out', async () => {
        wrapper = await mountNavbar()

        await vi.waitFor(() => expect(wrapper!.find('a[href="/account/login"]').exists()).toBe(true))
    })

    it("links to the account page with the customer's name when signed in", async () => {
        customer = {email: 'jan@example.nl', first_name: 'Jan'}
        wrapper = await mountNavbar()

        await vi.waitFor(() => {
            const link = wrapper!.find('a[href="/account"]')
            expect(link.exists()).toBe(true)
            expect(link.text()).toBe('Jan')
        })
    })

    it('styles the cart and login links as plain links, not buttons', async () => {
        wrapper = await mountNavbar()

        const cartButton = wrapper.findAllComponents({name: 'UButton'}).find((button) => button.props('to') === '/cart')
        const loginButton = wrapper
            .findAllComponents({name: 'UButton'})
            .find((button) => button.props('to') === '/account/login')

        expect(cartButton!.props('variant')).toBe('link')
        expect(loginButton!.props('variant')).toBe('link')
    })

    it('keeps the mobile menu button as a button', async () => {
        wrapper = await mountNavbar()

        const menuButton = wrapper
            .findAllComponents({name: 'UButton'})
            .find((button) => button.attributes('aria-label') === 'Menu openen')

        expect(menuButton!.props('variant')).toBe('ghost')
    })
})
