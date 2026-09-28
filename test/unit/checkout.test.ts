import {describe, expect, it} from 'vitest'
import {
    addressLine1,
    checkoutCountries,
    checkoutLimits,
    normalizeAddressRequest,
    validateAddressRequest
} from '../../shared/utils/checkout'
import type {AddressRequest} from '../../shared/utils/checkout'

const validRequest: AddressRequest = {
    email: 'jan@example.nl',
    firstName: 'Jan',
    lastName: 'Jansen',
    street: 'Kerkstraat',
    houseNumber: '12',
    postalCode: '1234 AB',
    city: 'Amsterdam',
    country: 'NL'
}

const errorFields = (request: Partial<AddressRequest>) =>
    validateAddressRequest({...validRequest, ...request}).map((error) => error.name)

describe('checkoutCountries', () => {
    it('offers only NL and BE', () => {
        expect(checkoutCountries.map((country) => country.code)).toEqual(['NL', 'BE'])
    })
})

describe('normalizeAddressRequest', () => {
    it('trims every field', () => {
        const request = normalizeAddressRequest({...validRequest, city: '  Amsterdam  '})
        expect(request.city).toBe('Amsterdam')
    })

    it('collapses line breaks in every field', () => {
        const request = normalizeAddressRequest({...validRequest, street: 'Kerkstraat\r\nBcc: x'})
        expect(request.street).toBe('Kerkstraat Bcc: x')
    })

    it('uppercases the country code', () => {
        expect(normalizeAddressRequest({...validRequest, country: 'nl'}).country).toBe('NL')
    })

    it('turns missing and non-string values into empty strings', () => {
        expect(normalizeAddressRequest({city: 5, email: null})).toEqual({
            email: '',
            firstName: '',
            lastName: '',
            street: '',
            houseNumber: '',
            postalCode: '',
            city: '',
            country: ''
        })
        expect(normalizeAddressRequest(null).email).toBe('')
    })
})

describe('validateAddressRequest', () => {
    it('accepts a valid NL request', () => {
        expect(validateAddressRequest(validRequest)).toEqual([])
    })

    it('accepts a valid BE request', () => {
        expect(validateAddressRequest({...validRequest, country: 'BE', postalCode: '1000'})).toEqual([])
    })

    it.each(['', 'jan', 'jan@', 'jan@example', 'jan @example.nl'])('rejects the email "%s"', (email) => {
        expect(errorFields({email})).toEqual(['email'])
    })

    it.each(['firstName', 'lastName', 'street', 'houseNumber', 'city'] as const)('requires %s', (field) => {
        expect(errorFields({[field]: '   '})).toEqual([field])
    })

    it('rejects an unknown country', () => {
        expect(errorFields({country: 'DE'})).toEqual(['country'])
    })

    it('rejects an NL postal code without 4 digits and 2 letters', () => {
        expect(errorFields({postalCode: '12345'})).toEqual(['postalCode'])
        expect(errorFields({postalCode: '1234'})).toEqual(['postalCode'])
    })

    it('rejects a BE postal code that is not 4 digits', () => {
        expect(errorFields({country: 'BE', postalCode: '1234 AB'})).toEqual(['postalCode'])
    })

    it.each(['firstName', 'lastName', 'street', 'houseNumber', 'city'] as const)('limits the length of %s', (field) => {
        expect(errorFields({[field]: 'a'.repeat(checkoutLimits[field] + 1)})).toContain(field)
    })
})

describe('addressLine1', () => {
    it('joins street and house number', () => {
        expect(addressLine1('Kerkstraat', '12')).toBe('Kerkstraat 12')
    })
})
