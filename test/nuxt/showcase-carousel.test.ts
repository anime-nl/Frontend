import {afterEach, beforeEach, describe, expect, it} from 'vitest'
import {mountSuspended, registerEndpoint} from '@nuxt/test-utils/runtime'
import {getQuery} from 'h3'
import ShowcaseCarousel from '~/components/showcaseCarousel.vue'

const productRequests: Record<string, unknown>[] = []

registerEndpoint('/api/regions', () => ({regions: [{id: 'reg_nl'}]}))
registerEndpoint('/api/products', (event) => {
    productRequests.push(getQuery(event))

    return {
        products: [
            {id: 'prod_1', title: 'Zhongli Keychain', thumbnail: 'https://example.com/zhongli.jpg'},
            {id: 'prod_2', title: 'Nijika Keychain', thumbnail: null}
        ]
    }
})

const mountCarousel = () => mountSuspended(ShowcaseCarousel, {attachTo: document.body})

let wrapper: Awaited<ReturnType<typeof mountCarousel>> | undefined

beforeEach(() => {
    productRequests.length = 0
})

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

    it('caps its width so it does not blow up on ultrawide screens', async () => {
        wrapper = await mountCarousel()

        expect(wrapper.find('div').classes()).toContain('max-w-screen-2xl')
    })

    it('requests at most 10 products sorted by newest first', async () => {
        wrapper = await mountCarousel()

        expect(productRequests[0]).toMatchObject({limit: '10', order: '-created_at'})
    })

    it('gives every image the same fixed height so the carousel does not resize per slide', async () => {
        wrapper = await mountCarousel()

        const image = wrapper.find('img')
        expect(image.classes()).toContain('h-80')
        expect(image.classes()).toContain('object-cover')
    })
})
