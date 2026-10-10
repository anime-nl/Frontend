import {describe, expect, it} from 'vitest'
import {getOrderTimeline} from '#shared/utils/orderTimeline'

function steps(order: {payment_status?: string; fulfillment_status?: string}) {
    return getOrderTimeline(order).map(({key, state}) => `${key}:${state}`)
}

describe('getOrderTimeline', () => {
    it('lists placed, paid, fulfilled, shipped and delivered in order', () => {
        expect(getOrderTimeline({}).map((step) => step.key)).toEqual([
            'placed',
            'paid',
            'fulfilled',
            'shipped',
            'delivered'
        ])
    })

    it('shows a freshly placed unpaid order as waiting for payment', () => {
        expect(steps({payment_status: 'not_paid', fulfillment_status: 'not_fulfilled'})).toEqual([
            'placed:done',
            'paid:current',
            'fulfilled:upcoming',
            'shipped:upcoming',
            'delivered:upcoming'
        ])
    })

    it.each(['captured', 'authorized', 'partially_captured'])('counts %s payment as paid', (payment_status) => {
        expect(steps({payment_status, fulfillment_status: 'not_fulfilled'})).toEqual([
            'placed:done',
            'paid:done',
            'fulfilled:current',
            'shipped:upcoming',
            'delivered:upcoming'
        ])
    })

    it('marks a fulfilled order as waiting to be shipped', () => {
        expect(steps({payment_status: 'captured', fulfillment_status: 'fulfilled'})).toEqual([
            'placed:done',
            'paid:done',
            'fulfilled:done',
            'shipped:current',
            'delivered:upcoming'
        ])
    })

    it('marks a shipped order as waiting to be delivered', () => {
        expect(steps({payment_status: 'captured', fulfillment_status: 'shipped'})).toEqual([
            'placed:done',
            'paid:done',
            'fulfilled:done',
            'shipped:done',
            'delivered:current'
        ])
    })

    it('marks a delivered order as complete', () => {
        expect(steps({payment_status: 'captured', fulfillment_status: 'delivered'})).toEqual([
            'placed:done',
            'paid:done',
            'fulfilled:done',
            'shipped:done',
            'delivered:done'
        ])
    })

    it('does not mark anything past placed for a partially fulfilled order', () => {
        expect(steps({payment_status: 'captured', fulfillment_status: 'partially_fulfilled'})).toEqual([
            'placed:done',
            'paid:done',
            'fulfilled:current',
            'shipped:upcoming',
            'delivered:upcoming'
        ])
    })

    it('treats missing statuses as nothing paid or fulfilled yet', () => {
        expect(steps({})).toEqual([
            'placed:done',
            'paid:current',
            'fulfilled:upcoming',
            'shipped:upcoming',
            'delivered:upcoming'
        ])
    })
})
