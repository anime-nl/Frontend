import {afterEach, describe, expect, it} from 'vitest'
import {mountSuspended} from '@nuxt/test-utils/runtime'
import ProductCard from '~/components/productCard.vue'

let wrapper: Awaited<ReturnType<typeof mountSuspended>> | undefined

afterEach(() => {
    wrapper?.unmount()
})

describe('product card', () => {
    it('links to the product page', async () => {
        wrapper = await mountSuspended(ProductCard, {props: {product: {id: 'prod_1', title: 'Zhongli Keychain'}}})

        expect(wrapper.find('a').attributes('href')).toBe('/product/prod_1')
    })

    it('shows the title', async () => {
        wrapper = await mountSuspended(ProductCard, {props: {product: {id: 'prod_1', title: 'Zhongli Keychain'}}})

        expect(wrapper.text()).toContain('Zhongli Keychain')
    })

    it('shows the calculated price of the first variant', async () => {
        wrapper = await mountSuspended(ProductCard, {
            props: {
                product: {
                    id: 'prod_1',
                    title: 'Zhongli Keychain',
                    variants: [{calculated_price: {calculated_amount: 10.9, currency_code: 'eur'}}]
                }
            }
        })

        expect(wrapper.text()).toContain('10.90 EUR')
    })

    it('shows "Price unavailable" when there is no calculated price', async () => {
        wrapper = await mountSuspended(ProductCard, {props: {product: {id: 'prod_1', title: 'Zhongli Keychain'}}})

        expect(wrapper.text()).toContain('Price unavailable')
    })

    it('shows the thumbnail image when there is one', async () => {
        wrapper = await mountSuspended(ProductCard, {
            props: {product: {id: 'prod_1', title: 'Zhongli Keychain', thumbnail: 'https://example.com/img.png'}}
        })

        expect(wrapper.find('img').attributes('src')).toBe('https://example.com/img.png')
    })

    it('shows no image when there is no thumbnail', async () => {
        wrapper = await mountSuspended(ProductCard, {props: {product: {id: 'prod_1', title: 'Zhongli Keychain'}}})

        expect(wrapper.find('img').exists()).toBe(false)
    })
})
