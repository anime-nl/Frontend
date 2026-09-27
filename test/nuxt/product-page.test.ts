import {afterEach, describe, expect, it, vi} from 'vitest'
import {mountSuspended, registerEndpoint} from '@nuxt/test-utils/runtime'
import ProductPage from '~/pages/product/[id]/index.vue'
import product from '../fixtures/product.json'

const backorderableInStock = structuredClone(product.product)
backorderableInStock.variants[0]!.allow_backorder = true
backorderableInStock.variants[0]!.inventory_quantity = 5

const outOfStock = structuredClone(product.product)
outOfStock.variants[0]!.inventory_quantity = 0
outOfStock.variants[0]!.allow_backorder = false

const onBackorder = structuredClone(product.product)
onBackorder.variants[0]!.inventory_quantity = 0
onBackorder.variants[0]!.allow_backorder = true

registerEndpoint('/api/products/prod_1', () => ({product: product.product, region_id: 'reg_nl'}))
registerEndpoint('/api/products/prod_backorder', () => ({product: backorderableInStock, region_id: 'reg_nl'}))
registerEndpoint('/api/products/prod_out_of_stock', () => ({product: outOfStock, region_id: 'reg_nl'}))
registerEndpoint('/api/products/prod_on_backorder', () => ({product: onBackorder, region_id: 'reg_nl'}))

let wrapper: Awaited<ReturnType<typeof mountProduct>> | undefined

const mountProduct = (id = 'prod_1') => mountSuspended(ProductPage, {route: `/product/${id}`, attachTo: document.body})

afterEach(() => {
    wrapper?.unmount()
})

describe('product page', () => {
    it('shows the product title', async () => {
        wrapper = await mountProduct()

        expect(wrapper.find('h1').text()).toBe(product.product.title)
    })

    it('shows the product image scaled to fit and centered in a fixed-size box', async () => {
        wrapper = await mountProduct()

        const img = wrapper.find('img')
        expect(img.classes()).toContain('h-160')
        expect(img.classes()).toContain('object-contain')
        expect(img.classes()).toContain('object-center')
    })

    it('has no maximum quantity for a variant that is in stock and backorderable', async () => {
        wrapper = await mountProduct('prod_backorder')

        const quantityInput = wrapper.findComponent({name: 'UInputNumber'})
        expect(quantityInput.props('max')).toBeUndefined()
    })

    it('caps the maximum quantity to the stock of a variant that is not backorderable', async () => {
        wrapper = await mountProduct()

        const quantityInput = wrapper.findComponent({name: 'UInputNumber'})
        expect(quantityInput.props('max')).toBe(25)
    })

    describe('Product structured data', () => {
        const productJsonLd = async () => {
            await vi.waitFor(() => expect(document.querySelector('script[type="application/ld+json"]')).not.toBeNull())
            const script = document.querySelector('script[type="application/ld+json"]')!
            return JSON.parse(script.innerHTML)
        }

        it('describes an in-stock product with its price and availability', async () => {
            wrapper = await mountProduct()

            expect(await productJsonLd()).toEqual({
                '@context': 'https://schema.org',
                '@type': 'Product',
                name: product.product.title,
                description: product.product.description,
                image: [product.product.images[0]!.url, product.product.images[1]!.url],
                sku: product.product.variants[0]!.sku,
                offers: {
                    '@type': 'Offer',
                    price: 10.9,
                    priceCurrency: 'EUR',
                    availability: 'https://schema.org/InStock',
                    url: 'http://localhost:3000/product/prod_1'
                }
            })
        })

        it('marks an out-of-stock product as OutOfStock', async () => {
            wrapper = await mountProduct('prod_out_of_stock')

            expect((await productJsonLd()).offers.availability).toBe('https://schema.org/OutOfStock')
        })

        it('marks a backorderable, out-of-stock product as BackOrder', async () => {
            wrapper = await mountProduct('prod_on_backorder')

            expect((await productJsonLd()).offers.availability).toBe('https://schema.org/BackOrder')
        })
    })
})
