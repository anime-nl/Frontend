import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
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
registerEndpoint('/api/product-types', () => ({
    product_types: [
        {id: 'ptyp_tcg', value: 'TCG'},
        {id: 'ptyp_figures', value: 'Figures'},
        {id: 'ptyp_plush', value: 'Plush'},
        {id: 'ptyp_keychains', value: 'Keychains'}
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
    {
        page: TcgPage,
        heading: 'Trading Card Game (TCG) Collectie',
        categoryId: 'ptyp_tcg',
        title: 'TCG',
        description: 'Bekijk onze volledige catalogus met Trading Card Game-producten.'
    },
    {
        page: TcgSinglesPage,
        heading: 'Losse kaarten',
        categoryId: 'pcat_singles',
        title: 'TCG Losse kaarten',
        description: 'Koop losse kaarten in bulk.'
    },
    {
        page: TcgPacksPage,
        heading: 'Pakjes',
        categoryId: 'pcat_packs',
        title: 'TCG Pakjes',
        description: 'Waag je geluk met losse pakjes.'
    },
    {
        page: TcgBoostersPage,
        heading: 'Boosterboxen',
        categoryId: 'pcat_boosters',
        title: 'TCG Boosterboxen',
        description: "Koop dozen vol pakjes en extra's."
    },
    {
        page: FiguresPage,
        heading: 'Figuren Collectie',
        categoryId: 'ptyp_figures',
        title: 'Figuren',
        description: 'Bekijk onze volledige catalogus met figuren.'
    },
    {
        page: PrizeFiguresPage,
        heading: 'Prijsfiguren',
        categoryId: 'pcat_prize',
        title: 'Prijsfiguren',
        description: 'Mooie figuren voor lage prijzen.'
    },
    {
        page: ScaleFiguresPage,
        heading: 'Schaalfiguren',
        categoryId: 'pcat_scale',
        title: 'Schaalfiguren',
        description: 'Geweldig om mee te decoreren.'
    },
    {
        page: NoodleStoppersPage,
        heading: 'Noodle Stoppers',
        categoryId: 'pcat_noodle',
        title: 'Noodle Stoppers',
        description: 'Figuren met een functie'
    },
    {
        page: PlushPage,
        heading: 'Knuffels Collectie',
        categoryId: 'ptyp_plush',
        title: 'Knuffels',
        description: 'Bekijk onze volledige catalogus met knuffels.'
    },
    {
        page: KeychainsPage,
        heading: 'Sleutelhangers Collectie',
        categoryId: 'ptyp_keychains',
        title: 'Sleutelhangers',
        description: 'Bekijk onze volledige catalogus met sleutelhangers.'
    },
    {
        page: AcrylicKeychainsPage,
        heading: 'Acryl sleutelhangers',
        categoryId: 'pcat_acrylic',
        title: 'Acrylen sleutelhangers',
        description: 'Een brede selectie goedkope sleutelhangers.'
    },
    {
        page: MetalKeychainsPage,
        heading: 'Metalen sleutelhangers',
        categoryId: 'pcat_metal',
        title: 'Metalen sleutelhangers',
        description: 'Supersterke sleutelhangers.'
    }
])('$heading page', ({page, heading, categoryId, title, description}) => {
    it('renders its heading and requests the products of its own category', async () => {
        wrapper = await mountSuspended(page)

        expect(wrapper.find('h1').text()).toBe(heading)
        expect(categoryRequests[0]?.type_id ?? categoryRequests[0]?.category_id).toBe(categoryId)
    })

    it('sets a page title and meta description for search engines', async () => {
        wrapper = await mountSuspended(page)

        await vi.waitFor(() => expect(document.title).toBe(`${title} | AnimeNL`))
        expect(document.querySelector('meta[name="description"]')?.getAttribute('content')).toBe(description)
    })
})
