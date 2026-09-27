import {afterEach, describe, expect, it} from 'vitest'
import {mountSuspended, registerEndpoint} from '@nuxt/test-utils/runtime'
import IndexPage from '~/pages/index.vue'

registerEndpoint('/api/regions', () => ({regions: [{id: 'reg_nl'}]}))
registerEndpoint('/api/products', () => ({products: [{id: 'prod_1', title: 'Zhongli Keychain', thumbnail: null}]}))

let wrapper: Awaited<ReturnType<typeof mountSuspended>> | undefined

afterEach(() => {
    wrapper?.unmount()
})

describe('home page', () => {
    it('shows the showcase carousel and the new products carousel', async () => {
        wrapper = await mountSuspended(IndexPage, {attachTo: document.body})

        expect(wrapper.text()).toContain('New Products')
        expect(wrapper.text()).toContain('Zhongli Keychain')
    })
})
