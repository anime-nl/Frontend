import {describe, expect, it} from 'vitest'
import {
    bySeriesLink,
    categoryOptions,
    daysAgoIso,
    findCategoryId,
    productTypesAsCategories,
    withDescendantIds
} from '../../app/utils/search'

const categories = [
    {id: 'pcat_tcg', handle: 'tcg', name: 'TCG'},
    {id: 'pcat_plush', handle: 'plush', name: 'Plush'}
]

describe('bySeriesLink', () => {
    it('selects the category and asks to focus the collection dropdown', () => {
        expect(bySeriesLink('tcg')).toBe('/search?category=tcg&focus=collection')
    })
})

describe('findCategoryId', () => {
    it('finds a category by handle', () => {
        expect(findCategoryId(categories, 'plush')).toBe('pcat_plush')
    })

    it('finds a category by id', () => {
        expect(findCategoryId(categories, 'pcat_tcg')).toBe('pcat_tcg')
    })

    it('returns an empty string for an unknown or empty value', () => {
        expect(findCategoryId(categories, 'figures')).toBe('')
        expect(findCategoryId(categories, '')).toBe('')
    })
})

describe('withDescendantIds', () => {
    const tree = [
        {id: 'pcat_tcg', handle: 'tcg', name: 'TCG', parent_category_id: null},
        {id: 'pcat_singles', handle: 'singles', name: 'Singles', parent_category_id: 'pcat_tcg'},
        {id: 'pcat_rare', handle: 'rare', name: 'Rare', parent_category_id: 'pcat_singles'},
        {id: 'pcat_plush', handle: 'plush', name: 'Plush', parent_category_id: null}
    ]

    it('includes the children and grandchildren of a category', () => {
        expect(withDescendantIds(tree, 'pcat_tcg')).toEqual(['pcat_tcg', 'pcat_singles', 'pcat_rare'])
    })

    it('returns only the category itself when it has no children', () => {
        expect(withDescendantIds(tree, 'pcat_plush')).toEqual(['pcat_plush'])
    })
})

describe('productTypesAsCategories', () => {
    it('uses the lowercased type value as handle', () => {
        expect(productTypesAsCategories([{id: 'ptyp_1', value: 'Figures'}])).toEqual([
            {id: 'ptyp_1', handle: 'figures', name: 'Figures'}
        ])
    })

    it('maps production\'s "Plushies" to the navbar\'s "plush" handle', () => {
        expect(productTypesAsCategories([{id: 'ptyp_2', value: 'Plushies'}])[0]?.handle).toBe('plush')
    })
})

describe('categoryOptions', () => {
    const tree = [
        {id: 'pcat_singles', handle: 'singles', name: 'Singles', parent_category_id: 'pcat_tcg'},
        {id: 'pcat_plush', handle: 'plush', name: 'Plush', parent_category_id: null},
        {id: 'pcat_tcg', handle: 'tcg', name: 'TCG'}
    ]

    it('lists a subcategory right below its parent, labelled with its path', () => {
        expect(categoryOptions(tree)).toEqual([
            {id: 'pcat_plush', label: 'Plush'},
            {id: 'pcat_tcg', label: 'TCG'},
            {id: 'pcat_singles', label: 'TCG › Singles'}
        ])
    })
})

describe('daysAgoIso', () => {
    it('returns the moment that many days before now', () => {
        expect(daysAgoIso(30, new Date('2026-10-31T12:00:00.000Z'))).toBe('2026-10-01T12:00:00.000Z')
    })
})
