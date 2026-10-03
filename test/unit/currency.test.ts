import {describe, expect, it} from 'vitest'
import {formatCurrency} from '../../shared/utils/currency'

describe('formatCurrency', () => {
    it('formats an amount for the given locale', () => {
        expect(formatCurrency(10.9, 'eur', 'nl-NL')).toBe(
            new Intl.NumberFormat('nl-NL', {style: 'currency', currency: 'EUR'}).format(10.9)
        )
    })

    it('accepts a currency code in any case', () => {
        expect(formatCurrency(21.8, 'EUR', 'nl-NL')).toBe(formatCurrency(21.8, 'eur', 'nl-NL'))
    })

    it('formats using British number formatting for en-GB', () => {
        expect(formatCurrency(10.9, 'EUR', 'en-GB')).toBe(
            new Intl.NumberFormat('en-GB', {style: 'currency', currency: 'EUR'}).format(10.9)
        )
    })

    it('formats using German number formatting for de-DE', () => {
        expect(formatCurrency(10.9, 'EUR', 'de-DE')).toBe(
            new Intl.NumberFormat('de-DE', {style: 'currency', currency: 'EUR'}).format(10.9)
        )
    })

    it('keeps the currency fixed to EUR regardless of locale', () => {
        // Locale affects number formatting (grouping/decimal separators), never the currency itself:
        // this shop only ever sells in EUR, per Medusa's single-region setup.
        expect(formatCurrency(10.9, 'eur', 'de-DE')).toContain('€')
    })
})
