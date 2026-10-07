import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {mountSuspended, registerEndpoint} from '@nuxt/test-utils/runtime'
import {getQuery} from 'h3'
import SearchPage from '~/pages/search/index.vue'

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
let allProducts: {id: string; title: string; thumbnail: string | null}[] = []
let productsShouldFail = false
let collectionsShouldFail = false
let regionsShouldFail = false

registerEndpoint('/api/product-types', () => ({
    product_types: [
        {id: 'ptyp_tcg', value: 'TCG'},
        {id: 'ptyp_figures', value: 'Figures'}
    ]
}))
registerEndpoint('/api/collections', () => {
    if (collectionsShouldFail) throw new Error('down')
    return {collections: [{id: 'pcol_pokemon', title: 'Pokémon TCG'}]}
})
registerEndpoint('/api/regions', () => {
    if (regionsShouldFail) throw new Error('down')
    return {regions: [{id: 'reg_nl'}]}
})
registerEndpoint('/api/products', (event) => {
    const query = getQuery(event)
    productRequests.push(query)
    if (productsShouldFail) throw new Error('down')
    const limit = Number(query.limit)
    const offset = Number(query.offset)
    return {products: allProducts.slice(offset, offset + limit), count: allProducts.length}
})

let wrapper: Awaited<ReturnType<typeof mountSearch>> | undefined

const mountSearch = (query: string) => mountSuspended(SearchPage, {route: `/search?${query}`, attachTo: document.body})
const selectValue = (id: string) => (document.getElementById(id) as HTMLSelectElement).value

beforeEach(() => {
    productRequests.length = 0
    allProducts = []
    productsShouldFail = false
    collectionsShouldFail = false
    regionsShouldFail = false
    FakeIntersectionObserver.instances.length = 0
    vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver)
})

afterEach(() => {
    wrapper?.unmount()
    vi.unstubAllGlobals()
})

describe('search page', () => {
    it('sets a page title and meta description for search engines', async () => {
        wrapper = await mountSearch('')

        await vi.waitFor(() => expect(document.title).toBe('Zoeken | AnimeNL'))
        expect(document.querySelector('meta[name="description"]')?.getAttribute('content')).toContain('catalog')
    })

    it('selects the category from its handle', async () => {
        wrapper = await mountSearch('category=tcg')

        expect(selectValue('category-select')).toBe('ptyp_tcg')
    })

    it('selects the category from its id', async () => {
        wrapper = await mountSearch('category=ptyp_figures')

        expect(selectValue('category-select')).toBe('ptyp_figures')
    })

    it('leaves the category empty for an unknown category', async () => {
        wrapper = await mountSearch('category=bogus')

        expect(selectValue('category-select')).toBe('')
    })

    it('gives the category and collection selects a solid background, so their options stay readable regardless of OS color scheme', async () => {
        wrapper = await mountSearch('')

        for (const id of ['category-select', 'collection-select']) {
            const classes = document.getElementById(id)?.className.split(' ') ?? []
            expect(classes).toContain('bg-default')
            expect(classes).not.toContain('bg-transparent')
        }
    })

    it('searches products with the id of the selected category', async () => {
        wrapper = await mountSearch('category=tcg')

        await vi.waitFor(() => expect(productRequests.map((request) => request.type_id)).toContain('ptyp_tcg'))
    })

    it('applies the filters of a new search link while already on the search page', async () => {
        wrapper = await mountSearch('category=tcg')
        await vi.waitFor(() => expect(productRequests.length).toBeGreaterThan(0))

        await navigateTo('/search?category=figures&q=goku')

        await vi.waitFor(() => expect(selectValue('category-select')).toBe('ptyp_figures'))
        await vi.waitFor(() => expect(productRequests.at(-1)).toMatchObject({q: 'goku', type_id: 'ptyp_figures'}))
    })

    it('requests the calculated price for a region, so product cards can show a price', async () => {
        wrapper = await mountSearch('category=tcg')

        await vi.waitFor(() => expect(productRequests.length).toBeGreaterThan(0))
        expect(productRequests[0]?.fields).toContain('calculated_price')
        expect(productRequests[0]?.region_id).toBe('reg_nl')
    })

    it('focuses the collection dropdown when asked to', async () => {
        wrapper = await mountSearch('category=tcg&focus=collection')

        expect(document.activeElement?.id).toBe('collection-select')
    })

    it('does not focus the collection dropdown otherwise', async () => {
        wrapper = await mountSearch('category=tcg')

        expect(document.activeElement?.id).not.toBe('collection-select')
    })

    it('shows the products returned from the store', async () => {
        allProducts = [{id: 'prod_1', title: 'Charizard ex', thumbnail: null}]
        wrapper = await mountSearch('')

        await vi.waitFor(() => expect(wrapper!.text()).toContain('Charizard ex'))
    })

    it('shows a message and clears the filters when nothing matches', async () => {
        wrapper = await mountSearch('category=tcg')

        await vi.waitFor(() => expect(wrapper!.text()).toContain('Geen producten gevonden'))
        await wrapper.find('button').trigger('click')

        expect(selectValue('category-select')).toBe('')
        expect((document.getElementById('search-input') as HTMLInputElement).value).toBe('')
    })

    it('searches for typed text after a debounce', async () => {
        wrapper = await mountSearch('')
        await vi.waitFor(() => expect(productRequests.length).toBeGreaterThan(0))
        productRequests.length = 0

        await wrapper.find('#search-input').setValue('zhongli')

        await vi.waitFor(() => expect(productRequests.some((request) => request.q === 'zhongli')).toBe(true), {
            timeout: 1000
        })
    })

    it('searches with the id of the selected collection', async () => {
        wrapper = await mountSearch('')
        await vi.waitFor(() =>
            expect(document.querySelector('#collection-select option[value="pcol_pokemon"]')).not.toBeNull()
        )
        await wrapper.find('#collection-select').setValue('pcol_pokemon')

        await vi.waitFor(
            () => expect(productRequests.some((request) => request.collection_id === 'pcol_pokemon')).toBe(true),
            {timeout: 1000}
        )
    })

    it('loads another page once the sentinel scrolls into view', async () => {
        allProducts = Array.from({length: 15}, (_, i) => ({id: `prod_${i}`, title: `Product ${i}`, thumbnail: null}))
        wrapper = await mountSearch('')
        await vi.waitFor(() => expect(wrapper!.findAllComponents({name: 'ProductCard'})).toHaveLength(12))

        FakeIntersectionObserver.instances[0]?.intersect()

        await vi.waitFor(() => expect(wrapper!.findAllComponents({name: 'ProductCard'})).toHaveLength(15))
        expect(wrapper.text()).toContain('Je hebt het einde van de catalogus bereikt.')
    })

    it('recovers without crashing when the products request fails', async () => {
        productsShouldFail = true
        wrapper = await mountSearch('')

        await vi.waitFor(() => expect(productRequests.length).toBeGreaterThan(0))
        expect(wrapper.text()).toContain('Geen producten gevonden')
    })

    it('still loads products when only the collections lookup fails', async () => {
        allProducts = [{id: 'prod_1', title: 'Charizard ex', thumbnail: null}]
        collectionsShouldFail = true
        wrapper = await mountSearch('')

        await vi.waitFor(() => expect(wrapper!.text()).toContain('Charizard ex'))
    })

    it('does not search at all when the region lookup fails', async () => {
        allProducts = [{id: 'prod_1', title: 'Charizard ex', thumbnail: null}]
        regionsShouldFail = true
        wrapper = await mountSearch('')

        await vi.waitFor(() =>
            expect(document.querySelector('#collection-select option[value="pcol_pokemon"]')).not.toBeNull()
        )
        expect(productRequests).toHaveLength(0)
        expect(wrapper.text()).toContain('Geen producten gevonden')
    })
})
