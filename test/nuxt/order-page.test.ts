import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {mountSuspended, registerEndpoint} from '@nuxt/test-utils/runtime'
import {createError, getQuery} from 'h3'
import OrderPage from '~/pages/orders/[id].vue'

let orderResponse: unknown
let requestedToken: unknown

registerEndpoint('/api/orders/order_1', (event) => {
    requestedToken = getQuery(event).token
    if (!orderResponse) throw createError({statusCode: 404})
    return orderResponse
})

const baseOrder = {
    id: 'order_1',
    display_id: 42,
    currency_code: 'eur',
    created_at: '2026-10-10T10:00:00Z',
    payment_status: 'captured',
    fulfillment_status: 'shipped',
    item_subtotal: 20,
    shipping_total: 4.95,
    total: 24.95,
    items: [{id: 'item_1', title: 'Pikachu', product_title: 'Pikachu plushie', quantity: 2, total: 20}],
    shipping_address: {
        first_name: 'Jan',
        last_name: 'Jansen',
        address_1: 'Straat 1',
        postal_code: '1234AB',
        city: 'Utrecht'
    }
}

let wrapper: Awaited<ReturnType<typeof mountSuspended>> | undefined

beforeEach(() => {
    orderResponse = {order: baseOrder}
    requestedToken = undefined
})

afterEach(() => {
    wrapper?.unmount()
    vi.restoreAllMocks()
})

async function mountOrderPage() {
    wrapper = await mountSuspended(OrderPage, {route: '/orders/order_1?token=abc'})
    return wrapper
}

describe('order page', () => {
    it('shows the order number, items and total', async () => {
        const page = await mountOrderPage()

        expect(page.text()).toContain('42')
        expect(page.text()).toContain('Pikachu plushie')
        expect(page.text()).toContain('24,95')
    })

    it('passes the link token to the API', async () => {
        await mountOrderPage()

        expect(requestedToken).toBe('abc')
    })

    it('shows the timeline with the shipped step done and delivered current', async () => {
        const page = await mountOrderPage()

        expect(page.find('[data-state="done"]').exists()).toBe(true)
        expect(page.findAll('[data-state="done"]')).toHaveLength(4)
        expect(page.findAll('[data-state="current"]')).toHaveLength(1)
        expect(page.text()).toContain('Bezorgd')
    })

    it('shows the shipping address', async () => {
        const page = await mountOrderPage()

        expect(page.text()).toContain('Straat 1')
        expect(page.text()).toContain('Utrecht')
    })

    it('shows a not found message when the order cannot be loaded', async () => {
        orderResponse = undefined
        const page = await mountOrderPage()

        expect(page.text()).toContain('Bestelling niet gevonden')
    })
})
