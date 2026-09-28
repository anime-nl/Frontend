import {afterEach, describe, expect, it, vi} from 'vitest'
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
    it('sets a page title and meta description for search engines', async () => {
        wrapper = await mountSuspended(IndexPage, {attachTo: document.body})

        await vi.waitFor(() => expect(document.title).toBe('Home | AnimeNL'))
        expect(document.querySelector('meta[name="description"]')?.getAttribute('content')).toContain('AnimeNL')
    })

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

    it('shows a search bar between the showcase carousel and the discovery grid', async () => {
        wrapper = await mountSuspended(IndexPage, {attachTo: document.body})

        const order = [...wrapper.element.querySelectorAll('h1, input')].map((element) =>
            element.tagName === 'INPUT' ? 'input' : element.textContent
        )
        expect(order).toEqual(['New Products', 'input', 'Discover'])
    })
})
