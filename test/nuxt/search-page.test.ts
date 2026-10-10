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

registerEndpoint('/api/categories', () => ({
    product_categories: [
        {id: 'pcat_tcg', handle: 'tcg', name: 'TCG', parent_category_id: null},
        {id: 'pcat_singles', handle: 'singles', name: 'Singles', parent_category_id: 'pcat_tcg'},
        {id: 'pcat_figures', handle: 'figures', name: 'Figures', parent_category_id: null}
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
const clearFiltersButton = () => wrapper!.findAll('button').find((button) => button.text() === 'Filters wissen')!
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

        expect(selectValue('category-select')).toBe('pcat_tcg')
    })

    it('selects the category from its id', async () => {
        wrapper = await mountSearch('category=pcat_figures')

        expect(selectValue('category-select')).toBe('pcat_figures')
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

    it('lists a subcategory below its parent, labelled with its path', async () => {
        wrapper = await mountSearch('')

        const labels = [...document.querySelectorAll('#category-select option')].map((option) =>
            option.textContent?.trim()
        )
        expect(labels).toEqual(['Alle categorieën', 'TCG', 'TCG › Singles', 'Figures'])
    })

    it('searches products in the selected category and its subcategories', async () => {
        wrapper = await mountSearch('category=tcg')

        await vi.waitFor(() =>
            expect(productRequests.map((request) => request.category_id)).toContainEqual(['pcat_tcg', 'pcat_singles'])
        )
    })

    it('applies the filters of a new search link while already on the search page', async () => {
        wrapper = await mountSearch('category=tcg')
        await vi.waitFor(() => expect(productRequests.length).toBeGreaterThan(0))

        await navigateTo('/search?category=figures&q=goku')

        await vi.waitFor(() => expect(selectValue('category-select')).toBe('pcat_figures'))
        await vi.waitFor(() => expect(productRequests.at(-1)).toMatchObject({q: 'goku', category_id: 'pcat_figures'}))
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
        await clearFiltersButton().trigger('click')

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
        await vi.waitFor(() => expect(wrapper!.text()).toContain('Geen producten gevonden'))
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

    describe('filters', () => {
        const lastRequest = () => productRequests.at(-1)
        const waitForRequestWith = (expected: Record<string, unknown>) =>
            vi.waitFor(() => expect(lastRequest()).toMatchObject(expected), {timeout: 1000})

        it('leaves the order to Medusa until a sort is chosen, so keyword relevance is kept', async () => {
            wrapper = await mountSearch('')

            await vi.waitFor(() => expect(productRequests.length).toBeGreaterThan(0))
            expect(lastRequest()).not.toHaveProperty('sort')
        })

        it('sends the chosen sort order', async () => {
            wrapper = await mountSearch('')
            await wrapper.find('#sort-select').setValue('price_asc')

            await waitForRequestWith({sort: 'price_asc'})
        })

        it('sends the price range', async () => {
            wrapper = await mountSearch('')
            await wrapper.find('#min-price-input').setValue('5')
            await wrapper.find('#max-price-input').setValue('20.5')

            await waitForRequestWith({min_price: '5', max_price: '20.5'})
        })

        it('sends no price range when the price fields are empty', async () => {
            wrapper = await mountSearch('')

            await vi.waitFor(() => expect(productRequests.length).toBeGreaterThan(0))
            expect(lastRequest()).not.toHaveProperty('min_price')
            expect(lastRequest()).not.toHaveProperty('max_price')
        })

        it('only asks for products added within the chosen number of days', async () => {
            wrapper = await mountSearch('')
            await wrapper.find('#added-select').setValue('30')

            await vi.waitFor(
                () => {
                    const since = lastRequest()?.['created_at[$gte]']
                    expect(typeof since).toBe('string')
                    const daysAgo = (Date.now() - new Date(since as string).getTime()) / (24 * 60 * 60 * 1000)
                    expect(daysAgo).toBeCloseTo(30, 1)
                },
                {timeout: 1000}
            )
        })

        it('asks for products in stock only', async () => {
            wrapper = await mountSearch('')
            await wrapper.find('#in-stock-checkbox').trigger('click')

            await waitForRequestWith({in_stock: 'true'})
        })

        it('asks for products on sale only', async () => {
            wrapper = await mountSearch('')
            await wrapper.find('#on-sale-checkbox').trigger('click')

            await waitForRequestWith({on_sale: 'true'})
        })

        it('clears every filter, not only the search text and selects', async () => {
            wrapper = await mountSearch('category=tcg')
            await wrapper.find('#min-price-input').setValue('5')
            await wrapper.find('#sort-select').setValue('title')
            await vi.waitFor(() => expect(wrapper!.text()).toContain('Geen producten gevonden'), {timeout: 1000})

            await clearFiltersButton().trigger('click')

            expect((document.getElementById('min-price-input') as HTMLInputElement).value).toBe('')
            expect(selectValue('sort-select')).toBe('')
            expect(selectValue('category-select')).toBe('')
        })
    })

    describe('url', () => {
        const currentQuery = () => useRoute().query

        it('shows the filters that are in the url', async () => {
            wrapper = await mountSearch('q=goku&category=tcg&min_price=5&in_stock=true&sort=title&added=30')

            expect((document.getElementById('search-input') as HTMLInputElement).value).toBe('goku')
            expect(selectValue('category-select')).toBe('pcat_tcg')
            expect((document.getElementById('min-price-input') as HTMLInputElement).value).toBe('5')
            expect(selectValue('sort-select')).toBe('title')
            expect(selectValue('added-select')).toBe('30')
            await vi.waitFor(() => expect(productRequests.at(-1)).toMatchObject({in_stock: 'true'}))
        })

        it('puts a changed search in the url without reloading the page', async () => {
            wrapper = await mountSearch('')
            await wrapper.find('#search-input').setValue('zhongli')
            await wrapper.find('#sort-select').setValue('price_desc')

            await vi.waitFor(() => expect(currentQuery()).toMatchObject({q: 'zhongli', sort: 'price_desc'}), {
                timeout: 1000
            })
            expect(wrapper.find('#search-input').exists()).toBe(true)
        })

        it('writes the category as its handle', async () => {
            wrapper = await mountSearch('')
            await wrapper.find('#category-select').setValue('pcat_figures')

            await vi.waitFor(() => expect(currentQuery().category).toBe('figures'), {timeout: 1000})
        })

        it('removes a filter from the url when it is cleared', async () => {
            wrapper = await mountSearch('q=goku&in_stock=true')
            await wrapper.find('#search-input').setValue('')

            await vi.waitFor(() => expect(currentQuery()).toEqual({in_stock: 'true'}), {timeout: 1000})
        })

        it('does not add a history entry for every change', async () => {
            wrapper = await mountSearch('')
            const historyLength = window.history.length
            await wrapper.find('#search-input').setValue('a')
            await vi.waitFor(() => expect(currentQuery().q).toBe('a'), {timeout: 1000})
            await wrapper.find('#search-input').setValue('ab')
            await vi.waitFor(() => expect(currentQuery().q).toBe('ab'), {timeout: 1000})

            expect(window.history.length).toBe(historyLength)
        })

        it('does not search again because of its own url update', async () => {
            wrapper = await mountSearch('')
            await wrapper.find('#search-input').setValue('zhongli')
            await vi.waitFor(() => expect(currentQuery().q).toBe('zhongli'), {timeout: 1000})
            await new Promise((resolve) => setTimeout(resolve, 700))

            expect(productRequests.filter((request) => request.q === 'zhongli')).toHaveLength(1)
        })
    })
})
