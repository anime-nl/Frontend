import {describe, expect, it} from 'vitest'
import {
    buildOrderLink,
    renderOrderConfirmation,
    type OrderConfirmationData
} from '../../medusa/src/modules/smtp-notification/order-confirmation'
import {isValidOrderToken} from '../../server/utils/orderToken'

const order: OrderConfirmationData = {
    displayId: 42,
    currencyCode: 'eur',
    items: [{title: 'Pikachu <b>plushie</b>', quantity: 2, total: 20}],
    subtotal: 20,
    shippingTotal: 4.95,
    total: 24.95,
    shippingAddress: {name: 'Jan Jansen', line1: 'Straat 1', postalCode: '1234 AB', city: 'Utrecht'},
    orderLink: 'https://animenl.nl/orders/order_1?token=abc',
    supportEmail: 'info@animenl.nl'
}

describe('buildOrderLink', () => {
    it('produces a link the storefront accepts for that order only', () => {
        const link = new URL(buildOrderLink('https://animenl.nl/', 'order_1', 'shared-secret'))
        const token = link.searchParams.get('token')!

        expect(link.origin + link.pathname).toBe('https://animenl.nl/orders/order_1')
        expect(isValidOrderToken('order_1', token, 'shared-secret')).toBe(true)
        expect(isValidOrderToken('order_2', token, 'shared-secret')).toBe(false)
        expect(isValidOrderToken('order_1', token, 'other-secret')).toBe(false)
    })
})

describe('renderOrderConfirmation', () => {
    it('puts the order number in the subject', () => {
        expect(renderOrderConfirmation(order).subject).toBe('Bevestiging van je bestelling #42')
    })

    it('lists items, totals, address and the order link in both bodies', () => {
        const {html, text} = renderOrderConfirmation(order)

        for (const body of [html, text]) {
            expect(body).toContain('2×')
            expect(body).toContain('24,95')
            expect(body).toContain('Straat 1')
            expect(body).toContain('https://animenl.nl/orders/order_1?token=abc')
            expect(body).toContain('info@animenl.nl')
        }
    })

    it('escapes product titles in the HTML body', () => {
        const {html} = renderOrderConfirmation(order)

        expect(html).toContain('Pikachu &lt;b&gt;plushie&lt;/b&gt;')
        expect(html).not.toContain('<b>plushie</b>')
    })

    it('leaves out the link and address when there are none', () => {
        const {html, text} = renderOrderConfirmation({...order, orderLink: undefined, shippingAddress: undefined})

        expect(html).not.toContain('Bekijk de status')
        expect(text).not.toContain('Bekijk de status')
        expect(text).not.toContain('Bezorgadres')
    })
})
