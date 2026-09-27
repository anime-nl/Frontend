import {describe, expect, it} from 'vitest'
import {formatCurrency} from '../../shared/utils/currency'

describe('formatCurrency', () => {
    it('formats an amount as Dutch-formatted EUR', () => {
        expect(formatCurrency(10.9, 'eur')).toBe(
            new Intl.NumberFormat('nl-NL', {style: 'currency', currency: 'EUR'}).format(10.9)
        )
    })

    it('accepts a currency code in any case', () => {
        expect(formatCurrency(21.8, 'EUR')).toBe(formatCurrency(21.8, 'eur'))
    })
})
