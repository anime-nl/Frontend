import {describe, expect, it} from 'vitest'
import {bySeriesLink, findCategoryId} from '../../app/utils/search'

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
