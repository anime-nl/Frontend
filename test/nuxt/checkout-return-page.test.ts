import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {mountSuspended, registerEndpoint} from '@nuxt/test-utils/runtime'
import {createError} from 'h3'
import CheckoutReturnPage from '~/pages/checkout/return.vue'

let completeResponse: unknown
let completeError: {statusCode: number; statusMessage: string} | undefined
let customer: {email: string; first_name: string; last_name: string} | null

registerEndpoint('/api/checkout/complete', {
    method: 'POST',
    handler: () => {
        if (completeError) throw createError(completeError)
        return completeResponse
    }
})
registerEndpoint('/api/account/me', () => {
    if (!customer) throw createError({statusCode: 401})
    return {customer}
})

let wrapper: Awaited<ReturnType<typeof mountSuspended>> | undefined

beforeEach(() => {
    completeResponse = undefined
    completeError = undefined
    customer = null
})

afterEach(() => {
    wrapper?.unmount()
})

describe('checkout return page', () => {
    it('shows the order number on success', async () => {
        completeResponse = {status: 'completed', order: {id: 'order_1', display_id: 42}}
        wrapper = await mountSuspended(CheckoutReturnPage)

        expect(wrapper.text()).toContain('42')
        expect(wrapper.text()).toContain('Thank you')
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

        expect(wrapper.text()).toContain('confirm')
    })

    it('shows a failed message with a link back to the cart', async () => {
        completeResponse = {status: 'failed', cart: {id: 'cart_1'}}
        wrapper = await mountSuspended(CheckoutReturnPage)

        expect(wrapper.text()).toContain('failed')
        expect(wrapper.find('a[href="/cart"]').exists()).toBe(true)
    })

    it('shows a pending message instead of a false failure when the complete request errors', async () => {
        completeError = {statusCode: 502, statusMessage: 'Could not complete order'}
        wrapper = await mountSuspended(CheckoutReturnPage)

        expect(wrapper.text()).toContain('confirm')
        expect(wrapper.text()).not.toContain('failed')
    })

    it('shows a neutral message when there is nothing to confirm', async () => {
        completeError = {statusCode: 400, statusMessage: 'No cart'}
        wrapper = await mountSuspended(CheckoutReturnPage)

        expect(wrapper.text()).toContain('Nothing to confirm here')
        expect(wrapper.text()).not.toContain('failed')
        expect(wrapper.text()).not.toContain('confirm your order')
    })
})
