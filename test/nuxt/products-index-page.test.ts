import {afterEach, describe, expect, it} from 'vitest'
import {mountSuspended, registerEndpoint} from '@nuxt/test-utils/runtime'
import ProductsIndexPage from '~/pages/products/index.vue'

registerEndpoint('/api/products', () => ({products: [{id: 'prod_1', title: 'Zhongli Keychain', thumbnail: null}]}))

let wrapper: Awaited<ReturnType<typeof mountSuspended>> | undefined

afterEach(() => {
    wrapper?.unmount()
})

describe('products index page', () => {
    it('shows the products from the store API route', async () => {
        wrapper = await mountSuspended(ProductsIndexPage)

        expect(wrapper.text()).toContain('Zhongli Keychain')
    })
})
