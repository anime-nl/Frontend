import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {mountSuspended, registerEndpoint} from '@nuxt/test-utils/runtime'
import {createError, readBody} from 'h3'
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
registerEndpoint('/api/cart', () => ({cart: null}))

let lastCartItemsBody: unknown
let itemsShouldFail = false

registerEndpoint('/api/cart/items', {
    method: 'POST',
    handler: async (event) => {
        lastCartItemsBody = await readBody(event)
        if (itemsShouldFail) throw createError({statusCode: 500})
        return {cart: {id: 'cart_1', items: [], currency_code: 'eur', subtotal: 0, total: 0}}
    }
})

let wrapper: Awaited<ReturnType<typeof mountProduct>> | undefined

const mountProduct = (id = 'prod_1') => mountSuspended(ProductPage, {route: `/product/${id}`, attachTo: document.body})

const addToCartButton = () =>
    wrapper!.findAllComponents({name: 'UButton'}).find((button) => button.props('icon') === 'i-lucide-shopping-cart')

beforeEach(() => {
    lastCartItemsBody = undefined
    itemsShouldFail = false
})

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

    it('adds the selected variant and quantity to the cart', async () => {
        wrapper = await mountProduct()

        await addToCartButton()!.trigger('click')
        await vi.waitFor(() => expect(lastCartItemsBody).toBeDefined())

        expect(lastCartItemsBody).toEqual({variant_id: product.product.variants[0]!.id, quantity: 1})
    })

    it('stops showing a loading button when adding to the cart fails', async () => {
        itemsShouldFail = true
        wrapper = await mountProduct()

        await addToCartButton()!.trigger('click')
        await vi.waitFor(() => expect(lastCartItemsBody).toBeDefined())
        await vi.waitFor(() => expect(addToCartButton()!.props('loading')).toBe(false))
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
