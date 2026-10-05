import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {mountSuspended, registerEndpoint} from '@nuxt/test-utils/runtime'
import {flushPromises} from '@vue/test-utils'
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
const catalog = Array.from({length: 100}, (_, i) => ({id: `prod_${i + 1}`, title: `Product ${i + 1}`, thumbnail: null}))

registerEndpoint('/api/regions', () => ({regions: [{id: 'reg_nl'}]}))
registerEndpoint('/api/products', (event) => {
    productRequests.push(getQuery(event))
    return {
        products:
            productCount === 0
                ? []
                : catalog.slice(
                      Number(getQuery(event).offset),
                      Number(getQuery(event).offset) + Number(getQuery(event).limit)
                  ),
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

        expect(wrapper.findAll('a')).toHaveLength(5)
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
        productCount = 100
        wrapper = await mountGrid()
        const before = wrapper.findAll('a').length

        FakeIntersectionObserver.instances[0]?.intersect()

        await vi.waitFor(() => expect(wrapper?.findAll('a').length).toBeGreaterThan(before))
    })

    it('never shows a product again within 30 other products', async () => {
        productCount = 100
        wrapper = await mountGrid()

        for (let i = 0; i < 3; i++) {
            const shown = wrapper.findAll('a').length
            FakeIntersectionObserver.instances.forEach((observer) => observer.intersect())
            await vi.waitFor(() => expect(wrapper?.findAll('a').length).toBeGreaterThan(shown))
            await flushPromises()
        }

        const links = wrapper.findAll('a').map((link) => link.attributes('href'))
        links.forEach((link, index) => {
            expect(links.slice(Math.max(index - 30, 0), index)).not.toContain(link)
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
