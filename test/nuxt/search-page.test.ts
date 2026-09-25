import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {mountSuspended, registerEndpoint} from '@nuxt/test-utils/runtime'
import {getQuery} from 'h3'
import SearchPage from '~/pages/search/index.vue'

const productRequests: Record<string, unknown>[] = []

registerEndpoint('/api/categories', () => ({
    product_categories: [
        {id: 'pcat_tcg', handle: 'tcg', name: 'TCG'},
        {id: 'pcat_figures', handle: 'figures', name: 'Figures'}
    ]
}))
registerEndpoint('/api/collections', () => ({collections: [{id: 'pcol_pokemon', title: 'Pokémon TCG'}]}))
registerEndpoint('/api/regions', () => ({regions: [{id: 'reg_nl'}]}))
registerEndpoint('/api/products', (event) => {
    productRequests.push(getQuery(event))
    return {products: [], count: 0}
})

let wrapper: Awaited<ReturnType<typeof mountSearch>> | undefined

const mountSearch = (query: string) => mountSuspended(SearchPage, {route: `/search?${query}`, attachTo: document.body})
const selectValue = (id: string) => (document.getElementById(id) as HTMLSelectElement).value

beforeEach(() => {
    productRequests.length = 0
})

afterEach(() => {
    wrapper?.unmount()
})

describe('search page', () => {
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

    it('searches products with the id of the selected category', async () => {
        wrapper = await mountSearch('category=tcg')

        await vi.waitFor(() => expect(productRequests.map((request) => request.category_id)).toContain('pcat_tcg'))
    })

    it('focuses the collection dropdown when asked to', async () => {
        wrapper = await mountSearch('category=tcg&focus=collection')

        expect(document.activeElement?.id).toBe('collection-select')
    })

    it('does not focus the collection dropdown otherwise', async () => {
        wrapper = await mountSearch('category=tcg')

        expect(document.activeElement?.id).not.toBe('collection-select')
    })
})
