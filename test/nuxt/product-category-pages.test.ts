import {afterEach, beforeEach, describe, expect, it} from 'vitest'
import {mountSuspended, registerEndpoint} from '@nuxt/test-utils/runtime'
import {getQuery} from 'h3'
import TcgPage from '~/pages/products/tcg/index.vue'
import TcgSinglesPage from '~/pages/products/tcg/singles/index.vue'
import TcgPacksPage from '~/pages/products/tcg/packs/index.vue'
import TcgBoostersPage from '~/pages/products/tcg/boosters/index.vue'
import FiguresPage from '~/pages/products/figures/index.vue'
import PrizeFiguresPage from '~/pages/products/figures/prize-figures/index.vue'
import ScaleFiguresPage from '~/pages/products/figures/scale-figures/index.vue'
import NoodleStoppersPage from '~/pages/products/figures/noodle-stoppers/index.vue'
import PlushPage from '~/pages/products/plush/index.vue'
import KeychainsPage from '~/pages/products/keychains/index.vue'
import AcrylicKeychainsPage from '~/pages/products/keychains/acrylic/index.vue'
import MetalKeychainsPage from '~/pages/products/keychains/metal/index.vue'

const categoryRequests: Record<string, unknown>[] = []

registerEndpoint('/api/categories', () => ({
    product_categories: [
        {id: 'pcat_tcg', handle: 'tcg', name: 'TCG'},
        {id: 'pcat_singles', handle: 'singles', name: 'Singles'},
        {id: 'pcat_packs', handle: 'packs', name: 'Packs'},
        {id: 'pcat_boosters', handle: 'boosters', name: 'Booster Boxes'},
        {id: 'pcat_figures', handle: 'figures', name: 'Figures'},
        {id: 'pcat_prize', handle: 'prize-figures', name: 'Prize Figures'},
        {id: 'pcat_scale', handle: 'scale-figures', name: 'Scale Figures'},
        {id: 'pcat_noodle', handle: 'noodle-stoppers', name: 'Noodle Stoppers'},
        {id: 'pcat_plush', handle: 'plush', name: 'Plush'},
        {id: 'pcat_keychains', handle: 'keychains', name: 'Keychains'},
        {id: 'pcat_acrylic', handle: 'acrylic', name: 'Acrylic keychains'},
        {id: 'pcat_metal', handle: 'metal', name: 'Metal keychains'}
    ]
}))
registerEndpoint('/api/regions', () => ({regions: [{id: 'reg_nl'}]}))
registerEndpoint('/api/products', (event) => {
    categoryRequests.push(getQuery(event))
    return {products: []}
})

let wrapper: Awaited<ReturnType<typeof mountSuspended>> | undefined

beforeEach(() => {
    categoryRequests.length = 0
})

afterEach(() => {
    wrapper?.unmount()
})

describe.each([
    {page: TcgPage, heading: 'Trading Card Game (TCG) Collection', categoryId: 'pcat_tcg'},
    {page: TcgSinglesPage, heading: 'Singles', categoryId: 'pcat_singles'},
    {page: TcgPacksPage, heading: 'Packs', categoryId: 'pcat_packs'},
    {page: TcgBoostersPage, heading: 'Booster Boxes', categoryId: 'pcat_boosters'},
    {page: FiguresPage, heading: 'Figures Collection', categoryId: 'pcat_figures'},
    {page: PrizeFiguresPage, heading: 'Prize Figures', categoryId: 'pcat_prize'},
    {page: ScaleFiguresPage, heading: 'Scale Figures', categoryId: 'pcat_scale'},
    {page: NoodleStoppersPage, heading: 'Noodle Stoppers', categoryId: 'pcat_noodle'},
    {page: PlushPage, heading: 'Plushies Collection', categoryId: 'pcat_plush'},
    {page: KeychainsPage, heading: 'Keychains Collection', categoryId: 'pcat_keychains'},
    {page: AcrylicKeychainsPage, heading: 'Acrylic keychains', categoryId: 'pcat_acrylic'},
    {page: MetalKeychainsPage, heading: 'Metal keychains', categoryId: 'pcat_metal'}
])('$heading page', ({page, heading, categoryId}) => {
    it('renders its heading and requests the products of its own category', async () => {
        wrapper = await mountSuspended(page)

        expect(wrapper.find('h1').text()).toBe(heading)
        expect(categoryRequests[0]?.category_id).toBe(categoryId)
    })
})
