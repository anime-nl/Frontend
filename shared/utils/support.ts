export interface SupportTopic {
    slug: string
    title: string
    icon: string
    description: string
    intro: string
    /** Options of the reason select, the first one is pre-selected */
    reasons: string[]
    orderNumberRequired: boolean
    messagePlaceholder: string
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

export const supportTopics: SupportTopic[] = [
    {
        slug: 'orders',
        title: 'Orders',
        icon: 'i-lucide-package',
        description: 'Questions about an order you placed or want to change.',
        intro: 'Tell us which order you are asking about and what you need.',
        reasons: ['Status of my order', 'Change my order', 'Cancel my order', 'Something else'],
        orderNumberRequired: true,
        messagePlaceholder: 'For example: which item you want changed, or what you would like to know about your order.'
    },
    {
        slug: 'shipping',
        title: 'Shipping',
        icon: 'i-lucide-truck',
        description: 'Delivery times and problems with a delivery.',
        intro: 'Shipping usually takes 2 to 3 days. If something is wrong with your delivery, let us know.',
        reasons: [
            'My order is taking longer than 2 to 3 days',
            'My tracking shows delivered, but I did not receive it',
            'My order was delivered to the wrong address',
            'Something else'
        ],
        orderNumberRequired: true,
        messagePlaceholder: 'For example: when you ordered, and what the delivery status currently shows.'
    },
    {
        slug: 'returns',
        title: 'Returns & refunds',
        icon: 'i-lucide-undo-2',
        description: 'Returning within 14 days, or received something damaged.',
        intro: 'You have 14 days to return an order. For damaged or wrong items, please describe what is wrong.',
        reasons: [
            'I want to return an item',
            'My item arrived damaged',
            'I received the wrong item',
            'Question about my refund'
        ],
        orderNumberRequired: true,
        messagePlaceholder:
            'For example: which item(s) you want to return and why, or what is wrong with the item you received.'
    },
    {
        slug: 'payments',
        title: 'Payments',
        icon: 'i-lucide-credit-card',
        description: 'iDEAL, credit card and other Mollie payment methods.',
        intro: 'We accept all payment methods supported by Mollie. If you have no order number because your payment failed, you can leave it empty.',
        reasons: [
            'My payment failed',
            'I was charged, but got no order confirmation',
            'Question about payment methods',
            'Something else'
        ],
        orderNumberRequired: false,
        messagePlaceholder: 'For example: which payment method you used, and what happened when you paid.'
    }
]

export const supportLimits = {name: 100, email: 254, orderNumber: 50, message: 5000}

export const findSupportTopic = (slug: unknown) => supportTopics.find((topic) => topic.slug === slug)

/**
 * Trims every field and turns anything that is not a string into an empty string.
 * Only the message may contain line breaks, so form input cannot fake extra lines in the email.
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

/** Used by the form for instant feedback, and by the server before sending */
export function validateSupportRequest(input: SupportRequest) {
    const request = normalizeSupportRequest(input)
    const {name, email, orderNumber, reason, message} = request
    const topic = findSupportTopic(request.topic)
    const errors: {name: keyof SupportRequest; message: string}[] = []

    if (!topic) errors.push({name: 'topic', message: 'Unknown support topic'})
    if (!name) errors.push({name: 'name', message: 'Please enter your name'})
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        errors.push({name: 'email', message: 'Please enter a valid email address'})
    if (!orderNumber && topic?.orderNumberRequired)
        errors.push({name: 'orderNumber', message: 'Please enter your order number'})
    if (topic && !topic.reasons.includes(reason)) errors.push({name: 'reason', message: 'Please choose a reason'})
    if (!message) errors.push({name: 'message', message: 'Please describe how we can help'})

    for (const field of ['name', 'email', 'orderNumber', 'message'] as const) {
        if (request[field].length > supportLimits[field]) {
            errors.push({name: field, message: `Please use at most ${supportLimits[field]} characters`})
        }
    }

    return errors
}
