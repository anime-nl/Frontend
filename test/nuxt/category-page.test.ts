import {afterEach, beforeEach, describe, expect, it} from 'vitest'
import {mountSuspended, registerEndpoint} from '@nuxt/test-utils/runtime'
import {getQuery} from 'h3'
import CategoryPage from '~/components/categoryPage.vue'

const productRequests: Record<string, unknown>[] = []

registerEndpoint('/api/categories', () => ({
    product_categories: [
        {id: 'pcat_tcg', handle: 'tcg', name: 'TCG'},
        {id: 'pcat_singles', handle: 'singles', name: 'Singles'}
    ]
}))
registerEndpoint('/api/regions', () => ({regions: [{id: 'reg_nl'}]}))
registerEndpoint('/api/products', (event) => {
    productRequests.push(getQuery(event))
    return {products: [{id: 'prod_1', title: 'Charizard ex', thumbnail: null}]}
})

let wrapper: Awaited<ReturnType<typeof mountSuspended>> | undefined

beforeEach(() => {
    productRequests.length = 0
})

afterEach(() => {
    wrapper?.unmount()
})

describe('category page', () => {
    it('shows the header with the given title and badge', async () => {
        wrapper = await mountSuspended(CategoryPage, {props: {handle: 'singles', badge: 'TCG', title: 'Singles'}})

        expect(wrapper.text()).toContain('TCG')
        expect(wrapper.find('h1').text()).toBe('Singles')
    })

    it('shows the products of the category resolved from its handle', async () => {
        wrapper = await mountSuspended(CategoryPage, {props: {handle: 'singles', title: 'Singles'}})

        expect(wrapper.text()).toContain('Charizard ex')
        expect(productRequests[0]?.category_id).toBe('pcat_singles')
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

    it('gives each product card an explicit height, since UPageColumns never sizes its children', async () => {
        wrapper = await mountSuspended(CategoryPage, {props: {handle: 'singles', title: 'Singles'}})

        expect(wrapper.find('a').classes()).toContain('h-100')
    })
})
