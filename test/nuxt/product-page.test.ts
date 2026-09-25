import {afterEach, describe, expect, it} from 'vitest'
import {mountSuspended, registerEndpoint} from '@nuxt/test-utils/runtime'
import ProductPage from '~/pages/product/[id]/index.vue'
import product from '../fixtures/product.json'

registerEndpoint('/api/products/prod_1', () => ({product: product.product, region_id: 'reg_nl'}))

let wrapper: Awaited<ReturnType<typeof mountProduct>> | undefined

const mountProduct = () => mountSuspended(ProductPage, {route: '/product/prod_1', attachTo: document.body})

afterEach(() => {
    wrapper?.unmount()
})

describe('product page', () => {
    it('shows the product title', async () => {
        wrapper = await mountProduct()

        expect(wrapper.find('h1').text()).toBe(product.product.title)
    })
})
