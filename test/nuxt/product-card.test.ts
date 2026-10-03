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

    it('shows a price-unavailable message when there is no calculated price, in the default (Dutch) locale', async () => {
        wrapper = await mountSuspended(ProductCard, {props: {product: {id: 'prod_1', title: 'Zhongli Keychain'}}})

        expect(wrapper.text()).toContain('Prijs niet beschikbaar')
    })

    it('shows a price-unavailable message when the calculated price has no amount', async () => {
        wrapper = await mountSuspended(ProductCard, {
            props: {
                product: {
                    id: 'prod_1',
                    title: 'Zhongli Keychain',
                    variants: [{calculated_price: {calculated_amount: null, currency_code: 'eur'}}]
                }
            }
        })

        expect(wrapper.text()).toContain('Prijs niet beschikbaar')
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

    it('fills its container width instead of imposing a fixed minimum, so it does not overflow a narrow grid column', async () => {
        wrapper = await mountSuspended(ProductCard, {props: {product: {id: 'prod_1', title: 'Zhongli Keychain'}}})

        const classes: string[] = wrapper.find('a > div').classes()
        expect(classes.some((className) => className.startsWith('min-w-'))).toBe(false)
    })
})
