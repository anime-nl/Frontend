import {afterEach, describe, expect, it} from 'vitest'
import {mountSuspended, registerEndpoint} from '@nuxt/test-utils/runtime'
import ShowcaseCarousel from '~/components/showcaseCarousel.vue'

registerEndpoint('/api/regions', () => ({regions: [{id: 'reg_nl'}]}))
registerEndpoint('/api/products', () => ({
    products: [
        {id: 'prod_1', title: 'Zhongli Keychain', thumbnail: 'https://example.com/zhongli.jpg'},
        {id: 'prod_2', title: 'Nijika Keychain', thumbnail: null}
    ]
}))

const mountCarousel = () => mountSuspended(ShowcaseCarousel, {attachTo: document.body})

let wrapper: Awaited<ReturnType<typeof mountCarousel>> | undefined

afterEach(() => {
    wrapper?.unmount()
})

describe('showcase carousel', () => {
    it('shows every new product that has a thumbnail', async () => {
        wrapper = await mountCarousel()

        const images = wrapper.findAll('img')
        expect(images).toHaveLength(1)
        expect(images[0]?.attributes('src')).toBe('https://example.com/zhongli.jpg')
    })

    it('links every product image to its product page', async () => {
        wrapper = await mountCarousel()

        const links = wrapper.findAll('a').map((link) => link.attributes('href'))
        expect(links).toContain('/product/prod_1')
    })
})
