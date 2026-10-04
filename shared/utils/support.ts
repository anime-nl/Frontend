import {isValidEmail} from './validation'

export interface SupportTopic {
    slug: string
    icon: string
    /** Stable keys into support.topics.<slug>.reasons.<key> in the locale catalogs. First one is pre-selected. */
    reasons: string[]
    orderNumberRequired: boolean
}

export interface SupportRequest {
    topic: string
    name: string
    email: string
    orderNumber: string
    reason: string
    message: string
    /** Honeypot, only bots fill this in */
    website: string
}

export interface SupportRequestError {
    name: keyof SupportRequest
    /** A key into validation.* in the locale catalogs */
    code: string
    params?: Record<string, string | number>
}

export const supportTopics: SupportTopic[] = [
    {
        slug: 'orders',
        icon: 'i-lucide-package',
        reasons: ['statusOfOrder', 'changeOrder', 'cancelOrder', 'somethingElse'],
        orderNumberRequired: true
    },
    {
        slug: 'shipping',
        icon: 'i-lucide-truck',
        reasons: ['tooSlow', 'trackingShowsDeliveredButNotReceived', 'wrongAddress', 'somethingElse'],
        orderNumberRequired: true
    },
    {
        slug: 'returns',
        icon: 'i-lucide-undo-2',
        reasons: ['wantToReturn', 'arrivedDamaged', 'wrongItemReceived', 'refundQuestion'],
        orderNumberRequired: true
    },
    {
        slug: 'payments',
        icon: 'i-lucide-credit-card',
        reasons: ['paymentFailed', 'chargedNoConfirmation', 'paymentMethodQuestion', 'somethingElse'],
        orderNumberRequired: false
    }
]

export const supportLimits = {name: 100, email: 254, orderNumber: 50, message: 5000}

/**
 * Looks up a support topic by slug.
 * @param slug Topic slug, of unknown type since it may come from unvalidated input
 * @returns The matching topic, or undefined if none matches
 */
export const findSupportTopic = (slug: unknown) => supportTopics.find((topic) => topic.slug === slug)

/**
 * Trims every field and turns anything that is not a string into an empty string.
 * Only the message may contain line breaks, so form input cannot fake extra lines in the email.
 * @param input Raw support form fields, possibly missing or of the wrong type
 * @returns A fully-populated SupportRequest
 */
export function normalizeSupportRequest(input?: Partial<Record<keyof SupportRequest, unknown>> | null): SupportRequest {
    const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '')
    const singleLine = (value: unknown) => text(value).replace(/\s+/g, ' ')

    return {
        topic: singleLine(input?.topic),
        name: singleLine(input?.name),
        email: singleLine(input?.email),
        orderNumber: singleLine(input?.orderNumber),
        reason: singleLine(input?.reason),
        message: text(input?.message),
        website: singleLine(input?.website)
    }
}

/**
 * Used by the form for instant feedback, and by the server before sending. Each error names a
 * validation.* key rather than display text, so the caller can translate it into the site locale.
 * @param input Support request to validate
 * @returns A list of field errors, empty when the request is valid
 */
export function validateSupportRequest(input: SupportRequest): SupportRequestError[] {
    const request = normalizeSupportRequest(input)
    const {name, email, orderNumber, reason, message} = request
    const topic = findSupportTopic(request.topic)
    const errors: SupportRequestError[] = []

    if (!topic) errors.push({name: 'topic', code: 'unknownTopic'})
    if (!name) errors.push({name: 'name', code: 'required'})
    if (!isValidEmail(email)) errors.push({name: 'email', code: 'invalidEmail'})
    if (!orderNumber && topic?.orderNumberRequired) errors.push({name: 'orderNumber', code: 'required'})
    if (topic && !topic.reasons.includes(reason)) errors.push({name: 'reason', code: 'invalidReason'})
    if (!message) errors.push({name: 'message', code: 'required'})

    for (const field of ['name', 'email', 'orderNumber', 'message'] as const) {
        if (request[field].length > supportLimits[field]) {
            errors.push({name: field, code: 'tooLong', params: {limit: supportLimits[field]}})
        }
    }

    return errors
}
