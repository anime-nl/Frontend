import {afterEach, describe, expect, it} from 'vitest'
import {mountSuspended, registerEndpoint} from '@nuxt/test-utils/runtime'
import IndexPage from '~/pages/index.vue'

registerEndpoint('/api/regions', () => ({regions: [{id: 'reg_nl'}]}))
registerEndpoint('/api/products', () => ({
    products: [{id: 'prod_1', title: 'Zhongli Keychain', thumbnail: 'https://example.com/zhongli.jpg'}],
    count: 1
}))

let wrapper: Awaited<ReturnType<typeof mountSuspended>> | undefined

afterEach(() => {
    wrapper?.unmount()
})

describe('home page', () => {
    it('shows the new products in the showcase carousel', async () => {
        wrapper = await mountSuspended(IndexPage, {attachTo: document.body})

        expect(wrapper.text()).toContain('New Products')
        expect(wrapper.findAll('img').at(0)?.attributes('src')).toBe('https://example.com/zhongli.jpg')
    })

    it('shows the random product discovery grid', async () => {
        wrapper = await mountSuspended(IndexPage, {attachTo: document.body})

        expect(wrapper.text()).toContain('Discover')
        expect(wrapper.text()).toContain('Zhongli Keychain')
    })
})
