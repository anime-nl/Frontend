import {afterEach, describe, expect, it} from 'vitest'
import {mountSuspended, registerEndpoint} from '@nuxt/test-utils/runtime'
import {getQuery} from 'h3'
import ProductCarousel from '~/components/productCarousel.vue'

const productRequests: Record<string, unknown>[] = []

registerEndpoint('/api/regions', () => ({regions: [{id: 'reg_nl'}]}))
registerEndpoint('/api/products', (event) => {
    productRequests.push(getQuery(event))
    return {
        products: [
            {id: 'prod_1', title: 'Zhongli Keychain', thumbnail: null},
            {id: 'prod_2', title: 'Nijika Keychain', thumbnail: null}
        ]
    }
})

let wrapper: Awaited<ReturnType<typeof mountCarousel>> | undefined

const mountCarousel = () => mountSuspended(ProductCarousel, {props: {title: 'New Products'}})

afterEach(() => {
    wrapper?.unmount()
})

describe('product carousel', () => {
    it('shows the products from the store API route', async () => {
        wrapper = await mountCarousel()

        expect(wrapper.text()).toContain('Zhongli Keychain')
        expect(wrapper.text()).toContain('Nijika Keychain')
    })

    it('links every product to its product page', async () => {
        wrapper = await mountCarousel()

        const links = wrapper.findAll('a').map((link) => link.attributes('href'))
        expect(links).toEqual(['/product/prod_1', '/product/prod_2'])
    })

    it('requests the calculated price for a region, so product cards can show a price', async () => {
        wrapper = await mountCarousel()

        const request = productRequests.at(-1)
        expect(request?.fields).toContain('calculated_price')
        expect(request?.region_id).toBe('reg_nl')
    })
})
