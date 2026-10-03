import {describe, expect, it} from 'vitest'
import {
    addressLine1,
    checkoutCountries,
    checkoutLimits,
    normalizeAddressRequest,
    splitStreetAndHouseNumber,
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

const errorCode = (request: Partial<AddressRequest>, field: keyof AddressRequest) =>
    validateAddressRequest({...validRequest, ...request}).find((error) => error.name === field)?.code

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
        expect(validateAddressRequest({...validRequest, email})).toEqual([{name: 'email', code: 'invalidEmail'}])
    })

    it.each(['firstName', 'lastName', 'street', 'houseNumber', 'city'] as const)('requires %s', (field) => {
        expect(validateAddressRequest({...validRequest, [field]: '   '})).toEqual([{name: field, code: 'required'}])
    })

    it('rejects an unknown country', () => {
        expect(validateAddressRequest({...validRequest, country: 'DE'})).toEqual([
            {name: 'country', code: 'invalidCountry'}
        ])
    })

    it('rejects an NL postal code without 4 digits and 2 letters', () => {
        expect(validateAddressRequest({...validRequest, postalCode: '12345'})).toEqual([
            {name: 'postalCode', code: 'invalidPostalCode'}
        ])
        expect(validateAddressRequest({...validRequest, postalCode: '1234'})).toEqual([
            {name: 'postalCode', code: 'invalidPostalCode'}
        ])
    })

    it('rejects a BE postal code that is not 4 digits', () => {
        expect(validateAddressRequest({...validRequest, country: 'BE', postalCode: '1234 AB'})).toEqual([
            {name: 'postalCode', code: 'invalidPostalCode'}
        ])
    })

    it.each(['firstName', 'lastName', 'street', 'houseNumber', 'city'] as const)('limits the length of %s', (field) => {
        expect(errorCode({[field]: 'a'.repeat(checkoutLimits[field] + 1)}, field)).toBe('tooLong')
    })

    it('includes the limit as a param on a tooLong error', () => {
        expect(
            validateAddressRequest({...validRequest, firstName: 'a'.repeat(checkoutLimits.firstName + 1)})
        ).toContainEqual({name: 'firstName', code: 'tooLong', params: {limit: checkoutLimits.firstName}})
    })
})

describe('addressLine1', () => {
    it('joins street and house number', () => {
        expect(addressLine1('Kerkstraat', '12')).toBe('Kerkstraat 12')
    })
})

describe('splitStreetAndHouseNumber', () => {
    it('splits a plain house number off the end', () => {
        expect(splitStreetAndHouseNumber('Kerkstraat 12')).toEqual({street: 'Kerkstraat', houseNumber: '12'})
    })

    it('splits a house number with a letter addition', () => {
        expect(splitStreetAndHouseNumber('Kerkstraat 12A')).toEqual({street: 'Kerkstraat', houseNumber: '12A'})
    })

    it('splits a house number with a hyphenated addition', () => {
        expect(splitStreetAndHouseNumber('Kerkstraat 12-A')).toEqual({street: 'Kerkstraat', houseNumber: '12-A'})
    })

    it('splits a house number with a word addition', () => {
        expect(splitStreetAndHouseNumber('Kerkstraat 12 bis')).toEqual({street: 'Kerkstraat', houseNumber: '12 bis'})
    })

    it('returns the original value as street with an empty house number when there is no number', () => {
        expect(splitStreetAndHouseNumber('Kerkstraat')).toEqual({street: 'Kerkstraat', houseNumber: ''})
    })

    it('does not consume a number from a multi-word street name', () => {
        expect(splitStreetAndHouseNumber('Prinses Irenestraat 1')).toEqual({
            street: 'Prinses Irenestraat',
            houseNumber: '1'
        })
    })
})
