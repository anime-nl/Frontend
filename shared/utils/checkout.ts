export interface AddressRequest {
    email: string
    firstName: string
    lastName: string
    street: string
    houseNumber: string
    postalCode: string
    city: string
    country: string
}

export interface AddressRequestError {
    name: keyof AddressRequest
    /** A key into validation.* in the locale catalogs */
    code: string
    params?: Record<string, string | number>
}

/** Display labels come from common.countries.<code> in the locale catalogs. */
export const checkoutCountries = [{code: 'NL'}, {code: 'BE'}] as const

export const checkoutLimits = {
    email: 254,
    firstName: 100,
    lastName: 100,
    street: 200,
    houseNumber: 20,
    postalCode: 20,
    city: 100
}

/** Loose postcode shape per country, not a deliverability check */
const postalCodePatterns: Record<string, RegExp> = {
    NL: /^\d{4}\s?[A-Za-z]{2}$/,
    BE: /^\d{4}$/
}

/**
 * Trims every field and turns anything that is not a string into an empty string, collapsing line breaks.
 * @param input Raw address fields, possibly missing or of the wrong type
 * @returns A fully-populated, single-line AddressRequest
 */
export function normalizeAddressRequest(input?: Partial<Record<keyof AddressRequest, unknown>> | null): AddressRequest {
    const singleLine = (value: unknown) => (typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '')

    return {
        email: singleLine(input?.email),
        firstName: singleLine(input?.firstName),
        lastName: singleLine(input?.lastName),
        street: singleLine(input?.street),
        houseNumber: singleLine(input?.houseNumber),
        postalCode: singleLine(input?.postalCode),
        city: singleLine(input?.city),
        country: singleLine(input?.country).toUpperCase()
    }
}

/**
 * Used by the form for instant feedback, and by the server before sending. Each error names a
 * validation.* key rather than display text, so the caller can translate it into the site locale.
 * @param input Address to validate
 * @returns A list of field errors, empty when the address is valid
 */
export function validateAddressRequest(input: AddressRequest): AddressRequestError[] {
    const request = normalizeAddressRequest(input)
    const {email, firstName, lastName, street, houseNumber, postalCode, city, country} = request
    const errors: AddressRequestError[] = []

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push({name: 'email', code: 'invalidEmail'})
    if (!firstName) errors.push({name: 'firstName', code: 'required'})
    if (!lastName) errors.push({name: 'lastName', code: 'required'})
    if (!street) errors.push({name: 'street', code: 'required'})
    if (!houseNumber) errors.push({name: 'houseNumber', code: 'required'})
    if (!city) errors.push({name: 'city', code: 'required'})

    const countryPattern = postalCodePatterns[country]
    if (!countryPattern) {
        errors.push({name: 'country', code: 'invalidCountry'})
    } else if (!countryPattern.test(postalCode)) {
        errors.push({name: 'postalCode', code: 'invalidPostalCode'})
    }

    for (const field of ['firstName', 'lastName', 'street', 'houseNumber', 'city'] as const) {
        if (request[field].length > checkoutLimits[field]) {
            errors.push({name: field, code: 'tooLong', params: {limit: checkoutLimits[field]}})
        }
    }

    return errors
}

/**
 * Medusa has no separate house-number field, so it is folded into the address's first line.
 * @param street Street name
 * @param houseNumber House number, possibly with an addition
 * @returns The combined address line
 */
export function addressLine1(street: string, houseNumber: string): string {
    return `${street} ${houseNumber}`.trim()
}

/**
 * Splits a trailing Dutch house-number pattern off a combined value, for when browser autofill
 * drops a full "Street 12A"-style address into a single field.
 * @param value The street field's current value
 * @returns The split street and house number, or the original value as street with an empty house
 *   number if no trailing house-number pattern is found
 */
export function splitStreetAndHouseNumber(value: string): {street: string; houseNumber: string} {
    const match = value.match(/^(.+?)\s+(\d+(?:[\s-]?[a-zA-Z0-9]+)?)$/)
    if (!match) return {street: value, houseNumber: ''}

    const [, street, houseNumber] = match
    // A bare 4+ digit number with no letter/word addition (e.g. "Plein 1944") is far more likely to
    // be part of a year-commemorating square/street name than a genuine house number, which is
    // virtually never four digits.
    if (/^\d{4,}$/.test(houseNumber!)) return {street: value, houseNumber: ''}

    return {street: street!, houseNumber: houseNumber!}
}
