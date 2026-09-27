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

export const checkoutCountries = [
    {code: 'NL', label: 'Netherlands'},
    {code: 'BE', label: 'Belgium'}
] as const

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

/** Trims every field and turns anything that is not a string into an empty string, collapsing line breaks */
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

/** Used by the form for instant feedback, and by the server before sending */
export function validateAddressRequest(input: AddressRequest) {
    const request = normalizeAddressRequest(input)
    const {email, firstName, lastName, street, houseNumber, postalCode, city, country} = request
    const errors: {name: keyof AddressRequest; message: string}[] = []

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        errors.push({name: 'email', message: 'Please enter a valid email address'})
    if (!firstName) errors.push({name: 'firstName', message: 'Please enter your first name'})
    if (!lastName) errors.push({name: 'lastName', message: 'Please enter your last name'})
    if (!street) errors.push({name: 'street', message: 'Please enter your street'})
    if (!houseNumber) errors.push({name: 'houseNumber', message: 'Please enter your house number'})
    if (!city) errors.push({name: 'city', message: 'Please enter your city'})

    const countryPattern = postalCodePatterns[country]
    if (!countryPattern) {
        errors.push({name: 'country', message: 'Please choose a valid country'})
    } else if (!countryPattern.test(postalCode)) {
        errors.push({name: 'postalCode', message: 'Please enter a valid postal code'})
    }

    for (const field of ['firstName', 'lastName', 'street', 'houseNumber', 'city'] as const) {
        if (request[field].length > checkoutLimits[field]) {
            errors.push({name: field, message: `Please use at most ${checkoutLimits[field]} characters`})
        }
    }

    return errors
}

/** Medusa has no separate house-number field, so it is folded into the address's first line */
export function addressLine1(street: string, houseNumber: string): string {
    return `${street} ${houseNumber}`.trim()
}
