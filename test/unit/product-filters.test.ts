import {describe, expect, it} from 'vitest'
import {
    isInStock,
    isOnSale,
    lowestPrice,
    matchesProductFilters,
    needsFullScan,
    parseProductFilters,
    sortByPrice
} from '../../shared/utils/productFilters'

const priced = (...amounts: number[]) => ({
    variants: amounts.map((amount) => ({calculated_price: {calculated_amount: amount, original_amount: amount}}))
})

describe('parseProductFilters', () => {
    it('reads prices, flags and sort from the query', () => {
        expect(
            parseProductFilters({min_price: '5', max_price: '20.5', in_stock: 'true', on_sale: 'true', sort: 'title'})
        ).toEqual({filters: {minPrice: 5, maxPrice: 20.5, inStock: true, onSale: true}, sort: 'title'})
    })

    it('ignores an invalid price, flag or sort', () => {
        const {filters, sort} = parseProductFilters({
            min_price: 'abc',
            max_price: '-3',
            in_stock: 'yes',
            sort: 'random'
        })

        expect(filters).toEqual({minPrice: undefined, maxPrice: undefined, inStock: false, onSale: false})
        expect(sort).toBeUndefined()
    })

    it('treats an empty price as not set rather than as zero', () => {
        expect(parseProductFilters({min_price: ''}).filters.minPrice).toBeUndefined()
    })
})

describe('needsFullScan', () => {
    it('is false when Medusa can do the whole search', () => {
        expect(needsFullScan({}, 'newest')).toBe(false)
        expect(needsFullScan({inStock: false})).toBe(false)
    })

    it.each([
        [{minPrice: 0}, undefined],
        [{maxPrice: 10}, undefined],
        [{inStock: true}, undefined],
        [{onSale: true}, undefined],
        [{}, 'price_asc'],
        [{}, 'price_desc']
    ] as const)('is true for %j sorted by %s', (filters, sort) => {
        expect(needsFullScan(filters, sort)).toBe(true)
    })
})

describe('lowestPrice', () => {
    it('is the cheapest variant', () => {
        expect(lowestPrice(priced(12, 8, 30))).toBe(8)
    })

    it('is null without a priced variant', () => {
        expect(lowestPrice({variants: [{calculated_price: null}]})).toBeNull()
        expect(lowestPrice({})).toBeNull()
    })
})

describe('isInStock', () => {
    it('is true when a variant has stock', () => {
        expect(isInStock({variants: [{manage_inventory: true, inventory_quantity: 0}, {inventory_quantity: 2}]})).toBe(
            true
        )
    })

    it('is true for a variant that does not track inventory', () => {
        expect(isInStock({variants: [{manage_inventory: false, inventory_quantity: 0}]})).toBe(true)
    })

    it('is true for a backorderable variant without stock', () => {
        expect(isInStock({variants: [{allow_backorder: true, inventory_quantity: 0}]})).toBe(true)
    })

    it('is false when every variant is sold out', () => {
        expect(isInStock({variants: [{manage_inventory: true, inventory_quantity: 0}]})).toBe(false)
    })
})

describe('isOnSale', () => {
    it('is true when the current price is below the original price', () => {
        expect(isOnSale({variants: [{calculated_price: {calculated_amount: 8, original_amount: 10}}]})).toBe(true)
    })

    it('is false at the regular price', () => {
        expect(isOnSale(priced(10))).toBe(false)
    })
})

describe('matchesProductFilters', () => {
    it('includes both ends of the price range', () => {
        expect(matchesProductFilters(priced(10), {minPrice: 10, maxPrice: 10})).toBe(true)
    })

    it('rejects a product outside the price range', () => {
        expect(matchesProductFilters(priced(9), {minPrice: 10})).toBe(false)
        expect(matchesProductFilters(priced(11), {maxPrice: 10})).toBe(false)
    })

    it('rejects a product without a price when a price filter is active', () => {
        expect(matchesProductFilters({variants: []}, {maxPrice: 10})).toBe(false)
    })

    it('accepts everything when no filter is active', () => {
        expect(matchesProductFilters({variants: []}, {})).toBe(true)
    })
})

describe('sortByPrice', () => {
    const cheap = {id: 'cheap', ...priced(5)}
    const dear = {id: 'dear', ...priced(50)}
    const unpriced = {id: 'unpriced', variants: []}

    it('puts the cheapest first, and products without a price last', () => {
        expect(sortByPrice([unpriced, dear, cheap], 'asc').map((p) => p.id)).toEqual(['cheap', 'dear', 'unpriced'])
    })

    it('puts the most expensive first, and products without a price last', () => {
        expect(sortByPrice([unpriced, cheap, dear], 'desc').map((p) => p.id)).toEqual(['dear', 'cheap', 'unpriced'])
    })

    it('does not change the array it is given', () => {
        const products = [dear, cheap]
        sortByPrice(products, 'asc')
        expect(products[0]).toBe(dear)
    })
})
