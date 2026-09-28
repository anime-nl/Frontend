import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {mountSuspended, registerEndpoint} from '@nuxt/test-utils/runtime'
import {createError} from 'h3'
import AccountPage from '~/pages/account/index.vue'

let signedIn = true
let orders: unknown[] = []
let ordersCallCount = 0
let logoutCallCount = 0

registerEndpoint('/api/account/me', () => {
    if (!signedIn) throw createError({statusCode: 401})
    return {customer: {id: 'cus_1', email: 'jan@example.nl'}}
})
registerEndpoint('/api/account/orders', () => {
    ordersCallCount++
    return {orders}
})
registerEndpoint('/api/account/logout', {
    method: 'POST',
    handler: () => {
        logoutCallCount++
        signedIn = false
        return {ok: true}
    }
})

const mountAccount = () => mountSuspended(AccountPage)

let wrapper: Awaited<ReturnType<typeof mountAccount>> | undefined

beforeEach(() => {
    signedIn = true
    orders = []
    ordersCallCount = 0
    logoutCallCount = 0
})

afterEach(() => {
    wrapper?.unmount()
})

describe('account page', () => {
    it('prompts to sign in when signed out', async () => {
        signedIn = false
        wrapper = await mountAccount()

        expect(wrapper.text().toLowerCase()).toContain('sign in')
        expect(wrapper.find('a[href="/account/login"]').exists()).toBe(true)
        expect(ordersCallCount).toBe(0)
    })

    it("shows the customer's email and a logout button when signed in", async () => {
        wrapper = await mountAccount()

        expect(wrapper.text()).toContain('jan@example.nl')
        expect(wrapper.text().toLowerCase()).toContain('log out')
    })

    it('shows a message when there are no orders yet', async () => {
        wrapper = await mountAccount()

        expect(wrapper.text().toLowerCase()).toContain('no orders')
    })

    it('shows order history when there are orders', async () => {
        orders = [{id: 'order_1', display_id: 42, status: 'completed', currency_code: 'eur', total: 21.8}]
        wrapper = await mountAccount()

        expect(wrapper.text()).toContain('42')
        expect(wrapper.text()).toContain('completed')
    })

    it('falls back to the order id when it has no display id', async () => {
        orders = [{id: 'order_1', display_id: null, status: 'completed', currency_code: 'eur', total: 21.8}]
        wrapper = await mountAccount()

        expect(wrapper.text()).toContain('order_1')
    })

    it('logs out and shows the sign-in prompt again', async () => {
        wrapper = await mountAccount()

        const logoutButton = wrapper
            .findAllComponents({name: 'UButton'})
            .find((button) => button.text().toLowerCase().includes('log out'))
        await logoutButton!.trigger('click')

        expect(logoutCallCount).toBe(1)
        await vi.waitFor(() => expect(wrapper!.text().toLowerCase()).toContain('sign in'))
    })
})
