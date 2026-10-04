import {describe, expect, it} from 'vitest'
import {isValidEmail} from '../../shared/utils/validation'

describe('isValidEmail', () => {
    it('accepts a plausible email address', () => {
        expect(isValidEmail('jan@example.nl')).toBe(true)
    })

    it.each(['', 'jan', 'jan@', 'jan@example', 'jan @example.nl'])('rejects "%s"', (email) => {
        expect(isValidEmail(email)).toBe(false)
    })
})
