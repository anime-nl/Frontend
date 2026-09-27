import {afterEach, describe, expect, it} from 'vitest'
import {mountSuspended, registerEndpoint} from '@nuxt/test-utils/runtime'
import ProductPage from '~/pages/product/[id]/index.vue'
import product from '../fixtures/product.json'

const backorderableInStock = structuredClone(product.product)
backorderableInStock.variants[0]!.allow_backorder = true
backorderableInStock.variants[0]!.inventory_quantity = 5

registerEndpoint('/api/products/prod_1', () => ({product: product.product, region_id: 'reg_nl'}))
registerEndpoint('/api/products/prod_backorder', () => ({product: backorderableInStock, region_id: 'reg_nl'}))

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
})
