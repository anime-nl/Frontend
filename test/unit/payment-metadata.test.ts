import {describe, expect, it} from 'vitest'
import type {StoreCart} from '@medusajs/types'
import {buildPaymentDescription, buildPaymentMetadata} from '../../server/utils/payment'

function cart(overrides: Partial<StoreCart> = {}) {
    return {
        id: 'cart_1',
        email: 'jan@example.nl',
        shipping_address: {
            first_name: 'Jan',
            last_name: 'de Vries',
            phone: '0612345678',
            address_1: 'Kerkstraat 1',
            postal_code: '1234 AB',
            city: 'Utrecht',
            country_code: 'nl'
        },
        items: [
            {product_title: 'Pikachu plushie', title: 'Large', quantity: 2},
            {product_title: 'Booster box', title: 'Display', quantity: 1}
        ],
        ...overrides
    } as StoreCart
}

describe('buildPaymentMetadata', () => {
    it('describes the customer and where the order ships', () => {
        expect(buildPaymentMetadata(cart())).toMatchObject({
            cart_id: 'cart_1',
            email: 'jan@example.nl',
            name: 'Jan de Vries',
            phone: '0612345678',
            address: 'Kerkstraat 1, 1234 AB, Utrecht, NL'
        })
    })

    it('lists each product with its quantity', () => {
        expect(buildPaymentMetadata(cart()).items).toEqual([
            {title: 'Pikachu plushie', quantity: 2},
            {title: 'Booster box', quantity: 1}
        ])
    })

    it('copes with a cart that has no shipping address yet', () => {
        const metadata = buildPaymentMetadata(cart({shipping_address: undefined}))

        expect(metadata.name).toBe('')
        expect(metadata.address).toBe('')
    })

    it('drops the items that do not fit in the one kilobyte Mollie allows', () => {
        const items = Array.from({length: 40}, (_, index) => ({product_title: `Product number ${index}`, quantity: 1}))

        const metadata = buildPaymentMetadata(cart({items: items as StoreCart['items']}))

        expect(Buffer.byteLength(JSON.stringify(metadata))).toBeLessThanOrEqual(1000)
        expect((metadata.items as unknown[]).length + (metadata.more_items as number)).toBe(40)
    })
})

describe('buildPaymentDescription', () => {
    it('references the cart by its last eight characters in capitals', () => {
        expect(buildPaymentDescription(cart({id: 'cart_01jxyzabcdef1234'}))).toBe('AnimeNL bestelling CDEF1234')
    })
})
