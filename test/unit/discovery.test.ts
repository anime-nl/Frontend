import {describe, expect, it} from 'vitest'
import type {StoreProduct} from '@medusajs/types'
import {
    DISCOVERY_MEMORY,
    discoveryWindow,
    pickUnseenProducts,
    rememberShown,
    shuffle
} from '../../shared/utils/discovery'

const product = (id: string) => ({id}) as StoreProduct

describe('shuffle', () => {
    it('keeps every item and leaves the input untouched', () => {
        const items = [1, 2, 3, 4, 5]

        expect(shuffle(items).sort()).toEqual([1, 2, 3, 4, 5])
        expect(items).toEqual([1, 2, 3, 4, 5])
    })
})

describe('discoveryWindow', () => {
    it('remembers 30 products in a large catalog', () => {
        expect(discoveryWindow(500)).toBe(DISCOVERY_MEMORY)
    })

    it('leaves one product eligible in a small catalog', () => {
        expect(discoveryWindow(5)).toBe(4)
    })

    it('remembers nothing for an empty or single-product catalog', () => {
        expect(discoveryWindow(0)).toBe(0)
        expect(discoveryWindow(1)).toBe(0)
    })
})

describe('pickUnseenProducts', () => {
    it('skips products that were shown recently', () => {
        const picked = pickUnseenProducts([product('a'), product('b'), product('c')], ['b'])

        expect(picked.map((p) => p.id).sort()).toEqual(['a', 'c'])
    })

    it('skips duplicates within the batch', () => {
        expect(pickUnseenProducts([product('a'), product('a')], [])).toHaveLength(1)
    })
})

describe('rememberShown', () => {
    it('drops the oldest ids beyond the window', () => {
        expect(rememberShown(['a', 'b'], [product('c'), product('d')], 3)).toEqual(['b', 'c', 'd'])
    })

    it('remembers nothing with an empty window', () => {
        expect(rememberShown(['a'], [product('b')], 0)).toEqual([])
    })
})
