import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {mockNuxtImport, mountSuspended, registerEndpoint} from '@nuxt/test-utils/runtime'
import {createError} from 'h3'
import AccountPage from '~/pages/account/index.vue'

const fakeRequestEvent = vi.hoisted(() => ({marker: 'fake-request-event'}))
const forwardSetCookieMock = vi.hoisted(() => vi.fn())
mockNuxtImport('useRequestEvent', () => () => fakeRequestEvent)
mockNuxtImport('forwardSetCookie', () => forwardSetCookieMock)

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
    forwardSetCookieMock.mockClear()
})

afterEach(() => {
    wrapper?.unmount()
})

describe('account page', () => {
    it('prompts to sign in when signed out', async () => {
        signedIn = false
        wrapper = await mountAccount()

        expect(wrapper.text().toLowerCase()).toContain('inloggen')
        expect(wrapper.find('a[href="/account/login"]').exists()).toBe(true)
        expect(ordersCallCount).toBe(0)
    })

    it("shows the customer's email and a logout button when signed in", async () => {
        wrapper = await mountAccount()

        expect(wrapper.text()).toContain('jan@example.nl')
        expect(wrapper.text().toLowerCase()).toContain('uitloggen')
    })

    it('shows a message when there are no orders yet', async () => {
        wrapper = await mountAccount()

        expect(wrapper.text().toLowerCase()).toContain('nog geen bestellingen')
    })

    it('shows order history when there are orders, with a translated status', async () => {
        orders = [{id: 'order_1', display_id: 42, status: 'completed', currency_code: 'eur', total: 21.8}]
        wrapper = await mountAccount()

        expect(wrapper.text()).toContain('42')
        expect(wrapper.text()).toContain('Afgerond')
        expect(wrapper.text()).not.toContain('completed')
    })

    it.each(['pending', 'draft', 'archived', 'canceled', 'requires_action'] as const)(
        'translates the %s order status',
        async (status) => {
            orders = [{id: 'order_1', display_id: 42, status, currency_code: 'eur', total: 21.8}]
            wrapper = await mountAccount()

            expect(wrapper.text()).not.toContain(status)
        }
    )

    it('falls back to the order id when it has no display id', async () => {
        orders = [{id: 'order_1', display_id: null, status: 'completed', currency_code: 'eur', total: 21.8}]
        wrapper = await mountAccount()

        expect(wrapper.text()).toContain('order_1')
    })

    it('logs out and shows the sign-in prompt again', async () => {
        wrapper = await mountAccount()

        const logoutButton = wrapper
            .findAllComponents({name: 'UButton'})
            .find((button) => button.text().toLowerCase().includes('uitloggen'))
        await logoutButton!.trigger('click')

        expect(logoutCallCount).toBe(1)
        await vi.waitFor(() => expect(wrapper!.text().toLowerCase()).toContain('inloggen'))
    })

    it('forwards the /api/account/me response onto the real browser response during SSR', async () => {
        wrapper = await mountAccount()

        await vi.waitFor(() => expect(forwardSetCookieMock).toHaveBeenCalledWith(fakeRequestEvent, expect.anything()))
    })
})
