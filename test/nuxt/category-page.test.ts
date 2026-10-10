import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {mountSuspended, registerEndpoint} from '@nuxt/test-utils/runtime'
import {getQuery} from 'h3'
import CategoryPage from '~/components/categoryPage.vue'

class FakeIntersectionObserver {
    static instances: FakeIntersectionObserver[] = []
    callback: IntersectionObserverCallback

    constructor(callback: IntersectionObserverCallback) {
        this.callback = callback
        FakeIntersectionObserver.instances.push(this)
    }

    observe() {}

    unobserve() {}

    disconnect() {}

    intersect() {
        this.callback([{isIntersecting: true} as IntersectionObserverEntry], this as unknown as IntersectionObserver)
    }
}

const productRequests: Record<string, unknown>[] = []

registerEndpoint('/api/categories', () => ({
    product_categories: [
        {id: 'pcat_tcg', handle: 'tcg', name: 'TCG'},
        {id: 'pcat_singles', handle: 'singles', name: 'Singles', parent_category_id: 'pcat_tcg'}
    ]
}))
registerEndpoint('/api/product-types', () => ({
    product_types: [
        {id: 'ptyp_tcg', value: 'TCG'},
        {id: 'ptyp_plushies', value: 'Plushies'}
    ]
}))
registerEndpoint('/api/regions', () => ({regions: [{id: 'reg_nl'}]}))
registerEndpoint('/api/products', (event) => {
    productRequests.push(getQuery(event))
    const offset = Number(getQuery(event).offset ?? 0)
    return {
        products: [{id: `prod_${offset + 1}`, title: `Charizard ex ${offset + 1}`, thumbnail: null}],
        count: totalProducts
    }
})

let totalProducts = 1
let wrapper: Awaited<ReturnType<typeof mountSuspended>> | undefined

beforeEach(() => {
    productRequests.length = 0
    totalProducts = 1
    FakeIntersectionObserver.instances.length = 0
    vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver)
})

afterEach(() => {
    wrapper?.unmount()
    vi.unstubAllGlobals()
})

describe('category page', () => {
    it('shows the header with the given title and badge', async () => {
        wrapper = await mountSuspended(CategoryPage, {props: {handle: 'singles', badge: 'TCG', title: 'Singles'}})

        expect(wrapper.text()).toContain('TCG')
        expect(wrapper.find('h1').text()).toBe('Singles')
    })

    it('shows the products of the category resolved from its handle', async () => {
        wrapper = await mountSuspended(CategoryPage, {props: {handle: 'singles', title: 'Singles'}})

        expect(wrapper.text()).toContain('Charizard ex 1')
        expect(productRequests[0]?.category_id).toBe('pcat_singles')
    })

    it('shows the products of the product type with the same handle', async () => {
        wrapper = await mountSuspended(CategoryPage, {props: {handle: 'plush', title: 'Plush'}})

        expect(productRequests[0]?.type_id).toBe('ptyp_plushies')
        expect(productRequests[0]?.category_id).toBeUndefined()
    })

    it('requests the calculated price for a region', async () => {
        wrapper = await mountSuspended(CategoryPage, {props: {handle: 'singles', title: 'Singles'}})

        expect(productRequests[0]?.fields).toContain('calculated_price')
        expect(productRequests[0]?.region_id).toBe('reg_nl')
    })

    it('shows an empty state for a handle that does not match any category, in the default (Dutch) locale', async () => {
        wrapper = await mountSuspended(CategoryPage, {props: {handle: 'unknown-handle', title: 'Unknown'}})

        expect(wrapper.text()).toContain('Nog geen producten in deze categorie.')
        expect(productRequests).toHaveLength(0)
    })

    it('gives each product card an explicit height, since the grid does not size the card contents', async () => {
        wrapper = await mountSuspended(CategoryPage, {props: {handle: 'singles', title: 'Singles'}})

        expect(wrapper.find('a').classes()).toContain('h-100')
    })

    it('loads the next page of the category once the sentinel scrolls into view', async () => {
        totalProducts = 2
        wrapper = await mountSuspended(CategoryPage, {props: {handle: 'singles', title: 'Singles'}})

        FakeIntersectionObserver.instances[0]?.intersect()

        await vi.waitFor(() => expect(wrapper?.text()).toContain('Charizard ex 2'))
        expect(productRequests.at(-1)?.offset).toBe('1')
        expect(productRequests.at(-1)?.category_id).toBe('pcat_singles')
    })

    it('does not request more products once all of them are shown', async () => {
        wrapper = await mountSuspended(CategoryPage, {props: {handle: 'singles', title: 'Singles'}})

        FakeIntersectionObserver.instances[0]?.intersect()
        await new Promise((resolve) => setTimeout(resolve, 50))

        expect(productRequests).toHaveLength(1)
    })
})
