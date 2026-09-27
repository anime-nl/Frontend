import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {mountSuspended, registerEndpoint} from '@nuxt/test-utils/runtime'
import {getQuery} from 'h3'
import RandomProductGrid from '~/components/randomProductGrid.vue'

class FakeIntersectionObserver {
    static instances: FakeIntersectionObserver[] = []
    callback: IntersectionObserverCallback
    observed: Element | null = null

    constructor(callback: IntersectionObserverCallback) {
        this.callback = callback
        FakeIntersectionObserver.instances.push(this)
    }

    observe(element: Element) {
        this.observed = element
    }

    unobserve() {
        this.observed = null
    }

    disconnect() {
        this.observed = null
    }

    intersect() {
        this.callback([{isIntersecting: true} as IntersectionObserverEntry], this as unknown as IntersectionObserver)
    }
}

const productRequests: Record<string, unknown>[] = []
let productCount = 5

registerEndpoint('/api/regions', () => ({regions: [{id: 'reg_nl'}]}))
registerEndpoint('/api/products', (event) => {
    productRequests.push(getQuery(event))
    return {
        products:
            productCount === 0
                ? []
                : [
                      {id: 'prod_1', title: 'Zhongli Keychain', thumbnail: null},
                      {id: 'prod_2', title: 'Nijika Keychain', thumbnail: null}
                  ],
        count: productCount
    }
})

let wrapper: Awaited<ReturnType<typeof mountGrid>> | undefined

const mountGrid = () => mountSuspended(RandomProductGrid, {attachTo: document.body})

beforeEach(() => {
    productRequests.length = 0
    productCount = 5
    FakeIntersectionObserver.instances.length = 0
    vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver)
})

afterEach(() => {
    wrapper?.unmount()
    vi.unstubAllGlobals()
})

describe('random product grid', () => {
    it('shows the first batch of products', async () => {
        wrapper = await mountGrid()

        expect(wrapper.text()).toContain('Zhongli Keychain')
        expect(wrapper.text()).toContain('Nijika Keychain')
    })

    it('does not render when there are no products', async () => {
        productCount = 0
        wrapper = await mountSuspended(RandomProductGrid)

        expect(wrapper.html()).toBe('<!--v-if-->')
    })

    it('requests the calculated price for a region, so product cards can show a price', async () => {
        wrapper = await mountGrid()

        const request = productRequests.at(-1)
        expect(request?.fields).toContain('calculated_price')
        expect(request?.region_id).toBe('reg_nl')
    })

    it('loads another batch of products once the sentinel scrolls into view', async () => {
        wrapper = await mountGrid()

        FakeIntersectionObserver.instances[0]?.intersect()

        await vi.waitFor(() => {
            const links = wrapper?.findAll('a').map((link) => link.attributes('href'))
            expect(links).toEqual(['/product/prod_1', '/product/prod_2', '/product/prod_1', '/product/prod_2'])
        })
    })

    it('requests an offset within the range that still fits a full batch', async () => {
        productCount = 100
        wrapper = await mountGrid()

        FakeIntersectionObserver.instances[0]?.intersect()
        await vi.waitFor(() => expect(productRequests.length).toBeGreaterThan(1))

        const offset = Number(productRequests.at(-1)?.offset)
        expect(offset).toBeGreaterThanOrEqual(0)
        expect(offset).toBeLessThanOrEqual(76)
    })
})
