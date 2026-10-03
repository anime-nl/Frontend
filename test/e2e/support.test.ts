import {afterAll, beforeEach, describe, expect, it} from 'vitest'
import {$fetch, fetch, setup} from '@nuxt/test-utils/e2e'
import {decodeMimeMessage, startSmtpSink} from '../helpers/smtpSink'

const smtp = await startSmtpSink()

await setup({
    server: true,
    nuxtConfig: {runtimeConfig: {smtpHost: '127.0.0.1', smtpPort: smtp.port}}
})

afterAll(() => smtp.close())

beforeEach(() => {
    smtp.messages.length = 0
    smtp.sink.rejectMail = false
})

const validRequest = {
    topic: 'returns',
    name: 'Jan Jansen',
    email: 'jan@example.nl',
    orderNumber: '1001',
    reason: 'wantToReturn',
    message: 'Please help',
    website: ''
}

// Every call gets its own address by default, so tests never share a rate limit bucket unless a test wants that
let nextIp = 0
const postSupport = (body: unknown, ip = `198.51.100.${++nextIp}`, locale?: string) =>
    fetch('/api/support', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: {
            'content-type': 'application/json',
            'x-forwarded-for': ip,
            ...(locale ? {'x-site-locale': locale} : {})
        }
    })

describe('support pages', () => {
    it('renders the overview with a link to every topic', async () => {
        const html = await $fetch<string>('/support')

        for (const slug of ['orders', 'shipping', 'returns', 'payments']) {
            expect(html).toContain(`href="/support/${slug}"`)
        }
    })

    it('renders the form of a topic on the server, in the default (Dutch) locale', async () => {
        const html = await $fetch<string>('/support/returns')

        expect(html).toContain('Retourneren &amp; terugbetalen')
        expect(html).toContain('Ik wil een artikel retourneren')
    })

    it('renders the form of a topic in English when prefixed with /en', async () => {
        const html = await $fetch<string>('/en/support/returns')

        expect(html).toContain('Returns &amp; refunds')
        expect(html).toContain('I want to return an item')
    })

    it('responds with a 404 for an unknown topic', async () => {
        const response = await fetch('/support/bogus')

        expect(response.status).toBe(404)
    })
})

describe('POST /api/support', () => {
    it.each([
        [
            'nl',
            'Subject: [Retourneren & terugbetalen] Bestelling 1001 - Ik wil een artikel retourneren',
            'Bestelnummer: 1001'
        ],
        ['en', 'Subject: [Returns & refunds] Order 1001 - I want to return an item', 'Order number: 1001'],
        [
            'de',
            'Subject: [Rücksendungen & Rückerstattungen] Bestellung 1001 - Ich möchte einen Artikel zurücksenden',
            'Bestellnummer: 1001'
        ]
    ] as const)(
        'emails the request to the support address, composed in %s',
        async (locale, expectedSubject, expectedOrderLine) => {
            const response = await postSupport(validRequest, undefined, locale)

            expect(response.status).toBe(200)
            expect(smtp.messages).toHaveLength(1)

            const mail = decodeMimeMessage(smtp.messages[0]!.raw)
            expect(mail).toContain('From: info@animenl.nl')
            expect(mail).toContain('To: info@animenl.nl')
            expect(mail).toContain('Reply-To: Jan Jansen <jan@example.nl>')
            expect(mail).toContain(expectedSubject)
            expect(mail).toContain(expectedOrderLine)
            expect(mail).toContain('Please help')
        }
    )

    it('defaults to Dutch when no locale header is sent', async () => {
        const response = await postSupport(validRequest)

        expect(response.status).toBe(200)
        expect(smtp.messages[0]!.raw).toContain('Subject: [Retourneren & terugbetalen]')
    })

    it('defaults to Dutch when the locale header is not a supported locale', async () => {
        const response = await postSupport(validRequest, undefined, 'fr')

        expect(response.status).toBe(200)
        expect(smtp.messages[0]!.raw).toContain('Subject: [Retourneren & terugbetalen]')
    })

    it('accepts a payments request without an order number', async () => {
        const response = await postSupport({
            ...validRequest,
            topic: 'payments',
            reason: 'paymentFailed',
            orderNumber: ''
        })

        expect(response.status).toBe(200)
        expect(smtp.messages[0]!.raw).toContain('Subject: [Betalingen] Mijn betaling is mislukt')
    })

    it('rejects an invalid request with the failing fields', async () => {
        const response = await postSupport({...validRequest, name: '', email: 'not-an-email'})

        expect(response.status).toBe(400)
        const {data} = await response.json()
        expect(data.map((error: {name: string}) => error.name)).toEqual(['name', 'email'])
        expect(smtp.messages).toHaveLength(0)
    })

    it('rejects a body with values that are not strings', async () => {
        const response = await postSupport({topic: 'orders', name: 5, email: null})

        expect(response.status).toBe(400)
    })

    it('keeps line breaks in form fields out of the email headers', async () => {
        const response = await postSupport({
            ...validRequest,
            name: 'Jan\r\nBcc: attacker@example.com',
            orderNumber: '1\r\nBcc: attacker@example.com'
        })

        expect(response.status).toBe(200)
        expect(smtp.messages[0]!.raw).not.toMatch(/^Bcc:/m)
    })

    it('pretends to succeed for the honeypot field without sending an email', async () => {
        const response = await postSupport({...validRequest, website: 'https://spam.example'})

        expect(response.status).toBe(200)
        expect(smtp.messages).toHaveLength(0)
    })

    it('responds with 502 when the mail server refuses the message', async () => {
        smtp.sink.rejectMail = true

        const response = await postSupport(validRequest)

        expect(response.status).toBe(502)
    })

    it('rate limits repeated requests from the same address', async () => {
        const ip = '203.0.113.42'

        for (let i = 0; i < 5; i++) {
            const response = await postSupport(validRequest, ip)
            expect(response.status).toBe(200)
        }

        const limited = await postSupport(validRequest, ip)
        expect(limited.status).toBe(429)
    })
})
