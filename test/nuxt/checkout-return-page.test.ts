import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {mountSuspended, registerEndpoint} from '@nuxt/test-utils/runtime'
import {createError} from 'h3'
import CheckoutReturnPage from '~/pages/checkout/return.vue'

let completeResponse: unknown
let completeError: {statusCode: number; statusMessage: string} | undefined
let customer: {email: string; first_name: string; last_name: string} | null
let cartFetchCount = 0
let completeCallCount = 0
let laterCompleteResponses: unknown[]

/** The path the router ended up on; stubbing navigateTo or router.replace would also break i18n's locale detection. */
function currentPath() {
    return useRouter().currentRoute.value.fullPath
}

registerEndpoint('/api/checkout/complete', {
    method: 'POST',
    handler: () => {
        completeCallCount++
        // The first call is the server-rendered one; later calls are the page polling.
        const next = completeCallCount > 1 ? laterCompleteResponses.shift() : undefined
        if (next instanceof Error) throw createError({statusCode: 400, statusMessage: 'No cart'})
        if (next) return next
        if (completeError) throw createError(completeError)
        return completeResponse
    }
})
registerEndpoint('/api/account/me', () => {
    if (!customer) throw createError({statusCode: 401})
    return {customer}
})
registerEndpoint('/api/cart', () => {
    cartFetchCount++
    return {cart: null}
})

let wrapper: Awaited<ReturnType<typeof mountSuspended>> | undefined

beforeEach(async () => {
    completeResponse = undefined
    completeError = undefined
    customer = null
    cartFetchCount = 0
    completeCallCount = 0
    laterCompleteResponses = []
    await useRouter().push('/checkout/return')
})

afterEach(() => {
    wrapper?.unmount()
    vi.useRealTimers()
})

describe('checkout return page', () => {
    it('shows the order number on success', async () => {
        completeResponse = {status: 'completed', order: {id: 'order_1', display_id: 42}}
        wrapper = await mountSuspended(CheckoutReturnPage)

        expect(wrapper.text()).toContain('42')
        expect(wrapper.text()).toContain('Bedankt')
    })

    it('links to order history when signed in', async () => {
        completeResponse = {status: 'completed', order: {id: 'order_1', display_id: 42}}
        customer = {email: 'jan@example.nl', first_name: 'Jan', last_name: 'Jansen'}
        wrapper = await mountSuspended(CheckoutReturnPage)

        await vi.waitFor(() => expect(wrapper!.find('a[href="/account"]').exists()).toBe(true))
    })

    it('does not link to order history when signed out', async () => {
        completeResponse = {status: 'completed', order: {id: 'order_1', display_id: 42}}
        wrapper = await mountSuspended(CheckoutReturnPage)

        expect(wrapper.find('a[href="/account"]').exists()).toBe(false)
    })

    it('shows a pending message when payment needs more action', async () => {
        completeResponse = {status: 'pending', cart: {id: 'cart_1'}}
        wrapper = await mountSuspended(CheckoutReturnPage)

        expect(wrapper.text()).toContain('bevestig')
    })

    it('shows a failed message with a link back to the cart', async () => {
        completeResponse = {status: 'failed', cart: {id: 'cart_1'}}
        wrapper = await mountSuspended(CheckoutReturnPage)

        expect(wrapper.text()).toContain('mislukt')
        expect(wrapper.find('a[href="/cart"]').exists()).toBe(true)
    })

    it('shows a pending message instead of a false failure when the complete request errors', async () => {
        completeError = {statusCode: 502, statusMessage: 'Could not complete order'}
        wrapper = await mountSuspended(CheckoutReturnPage)

        expect(wrapper.text()).toContain('bevestig')
        expect(wrapper.text()).not.toContain('mislukt')
    })

    it('shows a neutral message when there is nothing to confirm', async () => {
        completeError = {statusCode: 400, statusMessage: 'No cart'}
        wrapper = await mountSuspended(CheckoutReturnPage)

        expect(wrapper.text()).toContain('Niets te bevestigen')
        expect(wrapper.text()).not.toContain('mislukt')
        expect(wrapper.text()).not.toContain('We bevestigen')
    })

    it('refetches the cart after a successful completion', async () => {
        completeResponse = {status: 'completed', order: {id: 'order_1', display_id: 42}}
        wrapper = await mountSuspended(CheckoutReturnPage)

        await vi.waitFor(() => expect(cartFetchCount).toBe(2))
    })

    it('does not refetch the cart when payment is pending', async () => {
        completeResponse = {status: 'pending', cart: {id: 'cart_1'}}
        wrapper = await mountSuspended(CheckoutReturnPage)

        await vi.waitFor(() => expect(wrapper!.text()).toContain('bevestig'))
        expect(cartFetchCount).toBe(1)
    })

    it('does not refetch the cart when payment fails', async () => {
        completeResponse = {status: 'failed', cart: {id: 'cart_1'}}
        wrapper = await mountSuspended(CheckoutReturnPage)

        await vi.waitFor(() => expect(wrapper!.text()).toContain('mislukt'))
        expect(cartFetchCount).toBe(1)
    })

    it('redirects to the order page with its token once the order is completed', async () => {
        completeResponse = {status: 'completed', order: {id: 'order_1', display_id: 42}, token: 'tok'}
        wrapper = await mountSuspended(CheckoutReturnPage)

        expect(currentPath()).toBe('/orders/order_1?token=tok')
    })

    it('stays on the confirmation when the order has no link token', async () => {
        completeResponse = {status: 'completed', order: {id: 'order_1', display_id: 42}}
        wrapper = await mountSuspended(CheckoutReturnPage)

        expect(currentPath()).not.toContain('/orders/')
    })

    describe('while the payment is pending', () => {
        const POLL_INTERVAL_MS = 3000
        const realSetTimeout = globalThis.setTimeout

        beforeEach(() => {
            completeResponse = {status: 'pending'}
            // Fake timers hang mountSuspended, so only the page's poll interval is shortened.
            vi.spyOn(globalThis, 'setTimeout').mockImplementation(((handler: () => void, ms?: number) =>
                realSetTimeout(handler, ms === POLL_INTERVAL_MS ? 0 : ms)) as typeof setTimeout)
        })

        afterEach(() => {
            vi.restoreAllMocks()
        })

        it('keeps asking and redirects to the order page once the order exists', async () => {
            laterCompleteResponses = [
                {status: 'pending'},
                {status: 'completed', order: {id: 'order_1', display_id: 42}, token: 'tok'}
            ]
            wrapper = await mountSuspended(CheckoutReturnPage)

            await vi.waitFor(() => expect(currentPath()).toBe('/orders/order_1?token=tok'))
            expect(cartFetchCount).toBe(2)
            expect(completeCallCount).toBe(3)
        })

        it('shows the failure and stops asking once the payment failed', async () => {
            laterCompleteResponses = [{status: 'failed'}]
            wrapper = await mountSuspended(CheckoutReturnPage)

            await vi.waitFor(() => expect(wrapper!.text()).toContain('mislukt'))
            await new Promise((resolve) => realSetTimeout(resolve, 50))

            expect(completeCallCount).toBe(2)
            expect(cartFetchCount).toBe(1)
        })

        it('keeps the pending message and tells the customer an email follows after giving up', async () => {
            wrapper = await mountSuspended(CheckoutReturnPage)

            await vi.waitFor(() => expect(wrapper!.text()).toContain('e-mail'))
            expect(wrapper!.text()).not.toContain('mislukt')
            expect(completeCallCount).toBe(21)
            expect(cartFetchCount).toBe(1)
        })

        it('shows the neutral message when the cart was already completed elsewhere', async () => {
            laterCompleteResponses = [new Error('no cart')]
            wrapper = await mountSuspended(CheckoutReturnPage)

            await vi.waitFor(() => expect(wrapper!.text()).toContain('Niets te bevestigen'))
            expect(completeCallCount).toBe(2)
        })

        it('stops asking when the page is left', async () => {
            wrapper = await mountSuspended(CheckoutReturnPage)
            wrapper.unmount()
            await new Promise((resolve) => realSetTimeout(resolve, 50))
            const callsAfterLeaving = completeCallCount

            await new Promise((resolve) => realSetTimeout(resolve, 100))

            expect(completeCallCount).toBe(callsAfterLeaving)
            expect(callsAfterLeaving).toBeLessThan(21)
        })
    })
})
