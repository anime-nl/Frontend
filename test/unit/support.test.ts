import {describe, expect, it} from 'vitest'
import {
    findSupportTopic,
    normalizeSupportRequest,
    supportLimits,
    supportTopics,
    validateSupportRequest
} from '../../shared/utils/support'
import type {SupportRequest} from '../../shared/utils/support'

const validRequest: SupportRequest = {
    topic: 'returns',
    name: 'Jan Jansen',
    email: 'jan@example.nl',
    orderNumber: '1001',
    reason: 'wantToReturn',
    message: 'Please help',
    website: ''
}

const errorFields = (request: Partial<SupportRequest>) =>
    validateSupportRequest({...validRequest, ...request}).map((error) => error.name)

const errorCode = (request: Partial<SupportRequest>, field: keyof SupportRequest) =>
    validateSupportRequest({...validRequest, ...request}).find((error) => error.name === field)?.code

describe('supportTopics', () => {
    it('has unique slugs', () => {
        const slugs = supportTopics.map((topic) => topic.slug)
        expect(new Set(slugs).size).toBe(slugs.length)
    })

    it('offers at least one reason per topic', () => {
        for (const topic of supportTopics) {
            expect(topic.reasons.length, topic.slug).toBeGreaterThan(0)
        }
    })

    it('finds a topic by slug', () => {
        expect(findSupportTopic('payments')?.slug).toBe('payments')
    })

    it('returns undefined for an unknown slug', () => {
        expect(findSupportTopic('bogus')).toBeUndefined()
        expect(findSupportTopic(undefined)).toBeUndefined()
    })
})

describe('normalizeSupportRequest', () => {
    it('trims every field', () => {
        const request = normalizeSupportRequest({...validRequest, name: '  Jan  ', message: '\nhi\n'})
        expect(request.name).toBe('Jan')
        expect(request.message).toBe('hi')
    })

    it('collapses line breaks in single-line fields but keeps them in the message', () => {
        const request = normalizeSupportRequest({...validRequest, name: 'Jan\r\nBcc: x', message: 'a\nb'})
        expect(request.name).toBe('Jan Bcc: x')
        expect(request.message).toBe('a\nb')
    })

    it('turns missing and non-string values into empty strings', () => {
        expect(normalizeSupportRequest({name: 5, email: null})).toEqual({
            topic: '',
            name: '',
            email: '',
            orderNumber: '',
            reason: '',
            message: '',
            website: ''
        })
        expect(normalizeSupportRequest(null).topic).toBe('')
    })
})

describe('validateSupportRequest', () => {
    it('accepts a valid request', () => {
        expect(validateSupportRequest(validRequest)).toEqual([])
    })

    it('rejects an unknown topic', () => {
        expect(errorCode({topic: 'bogus'}, 'topic')).toBe('unknownTopic')
    })

    it.each(['name', 'message'] as const)('requires %s', (field) => {
        expect(errorCode({[field]: '   '}, field)).toBe('required')
    })

    it.each(['', 'jan', 'jan@', 'jan@example', 'jan @example.nl'])('rejects the email "%s"', (email) => {
        expect(errorCode({email}, 'email')).toBe('invalidEmail')
    })

    it('requires an order number for orders, shipping and returns', () => {
        for (const topic of ['orders', 'shipping', 'returns']) {
            const reason = findSupportTopic(topic)!.reasons[0]!
            expect(errorCode({topic, reason, orderNumber: ''}, 'orderNumber'), topic).toBe('required')
        }
    })

    it('does not require an order number for payments', () => {
        const reason = findSupportTopic('payments')!.reasons[0]!
        expect(errorFields({topic: 'payments', reason, orderNumber: ''})).toEqual([])
    })

    it('rejects a reason that belongs to another topic', () => {
        expect(errorCode({reason: 'paymentFailed'}, 'reason')).toBe('invalidReason')
    })

    it.each(['name', 'email', 'orderNumber', 'message'] as const)('limits the length of %s', (field) => {
        const tooLong =
            field === 'email' ? `${'a'.repeat(supportLimits.email)}@example.nl` : 'a'.repeat(supportLimits[field] + 1)
        expect(errorCode({[field]: tooLong}, field)).toBe('tooLong')
    })

    it('includes the limit as a param on a tooLong error', () => {
        expect(validateSupportRequest({...validRequest, name: 'a'.repeat(supportLimits.name + 1)})).toContainEqual({
            name: 'name',
            code: 'tooLong',
            params: {limit: supportLimits.name}
        })
    })

    it('accepts values exactly at the length limit', () => {
        expect(errorFields({name: 'a'.repeat(supportLimits.name), message: 'a'.repeat(supportLimits.message)})).toEqual(
            []
        )
    })
})
