import {afterEach, beforeAll, describe, expect, it, vi} from 'vitest'
import {decodeMimeMessage, startSmtpSink} from '../helpers/smtpSink'
import {SmtpNotificationProviderService} from '../../medusa/src/modules/smtp-notification/service'
import orderPlacedHandler from '../../medusa/src/subscribers/order-placed'
import {isValidOrderToken} from '../../server/utils/orderToken'

let smtp: Awaited<ReturnType<typeof startSmtpSink>>

beforeAll(async () => {
    smtp = await startSmtpSink()
    return () => smtp.close()
})

afterEach(() => {
    smtp.messages.length = 0
    smtp.sink.rejectMail = false
    vi.unstubAllEnvs()
})

function provider() {
    return new SmtpNotificationProviderService({}, {host: '127.0.0.1', port: smtp.port, from: 'info@animenl.nl'})
}

const confirmationData = {
    displayId: 42,
    currencyCode: 'eur',
    items: [{title: 'Pikachu plushie', quantity: 1, total: 20}],
    subtotal: 20,
    shippingTotal: 4.95,
    total: 24.95,
    supportEmail: 'info@animenl.nl'
}

describe('SmtpNotificationProviderService', () => {
    it('emails the order confirmation to the customer', async () => {
        await provider().send({
            to: 'jan@example.nl',
            channel: 'email',
            template: 'order-confirmation',
            data: confirmationData
        })

        expect(smtp.messages).toHaveLength(1)
        const message = decodeMimeMessage(smtp.messages[0]!.raw)
        expect(message).toContain('To: jan@example.nl')
        expect(message).toContain('From: info@animenl.nl')
        expect(message).toContain('Subject: Bevestiging van je bestelling #42')
        expect(message).toContain('Pikachu plushie')
    })

    it('refuses a template it does not know, without sending anything', async () => {
        await expect(
            provider().send({to: 'jan@example.nl', channel: 'email', template: 'newsletter', data: {}})
        ).rejects.toThrow('Unknown email template')
        expect(smtp.messages).toHaveLength(0)
    })

    it('fails when the SMTP server rejects the message, so Medusa can retry', async () => {
        smtp.sink.rejectMail = true

        await expect(
            provider().send({
                to: 'jan@example.nl',
                channel: 'email',
                template: 'order-confirmation',
                data: confirmationData
            })
        ).rejects.toThrow()
    })
})

describe('order.placed subscriber', () => {
    const order = {
        id: 'order_1',
        display_id: 42,
        email: 'jan@example.nl',
        currency_code: 'eur',
        item_subtotal: 20,
        shipping_total: 4.95,
        total: 24.95,
        items: [{title: 'Variant', product_title: 'Pikachu plushie', quantity: 1, total: 20}],
        shipping_address: {
            first_name: 'Jan',
            last_name: 'Jansen',
            address_1: 'Straat 1',
            postal_code: '1234 AB',
            city: 'Utrecht'
        }
    }

    function setup(orders: unknown[]) {
        const createNotifications = vi.fn()
        const logger = {warn: vi.fn()}
        const container = {
            resolve: (key: string) =>
                key === 'logger'
                    ? logger
                    : key === 'query'
                      ? {graph: async () => ({data: orders})}
                      : {createNotifications}
        }
        const run = () => orderPlacedHandler({event: {name: 'order.placed', data: {id: 'order_1'}}, container} as never)
        return {createNotifications, logger, run}
    }

    it('creates an email notification with a signed order link', async () => {
        vi.stubEnv('SMTP_HOST', '127.0.0.1')
        vi.stubEnv('STOREFRONT_URL', 'https://animenl.nl')
        vi.stubEnv('ORDER_LINK_SECRET', 'shared-secret')
        const {createNotifications, run} = setup([order])

        await run()

        expect(createNotifications).toHaveBeenCalledTimes(1)
        const notification = createNotifications.mock.calls[0]![0]
        expect(notification).toMatchObject({to: 'jan@example.nl', channel: 'email', template: 'order-confirmation'})
        expect(notification.data).toMatchObject({
            displayId: 42,
            items: [{title: 'Pikachu plushie', quantity: 1, total: 20}],
            total: 24.95,
            shippingAddress: {name: 'Jan Jansen', line1: 'Straat 1', postalCode: '1234 AB', city: 'Utrecht'}
        })
        const link = new URL(notification.data.orderLink)
        expect(link.pathname).toBe('/orders/order_1')
        expect(isValidOrderToken('order_1', link.searchParams.get('token')!, 'shared-secret')).toBe(true)
    })

    it('still sends the email, without a link, when the storefront link is not configured', async () => {
        vi.stubEnv('SMTP_HOST', '127.0.0.1')
        const {createNotifications, run} = setup([order])

        await run()

        expect(createNotifications.mock.calls[0]![0].data.orderLink).toBeUndefined()
    })

    it('does nothing but warn when SMTP is not configured', async () => {
        vi.stubEnv('SMTP_HOST', '')
        const {createNotifications, logger, run} = setup([order])

        await run()

        expect(createNotifications).not.toHaveBeenCalled()
        expect(logger.warn).toHaveBeenCalled()
    })

    it('does nothing for an order without an email address', async () => {
        vi.stubEnv('SMTP_HOST', '127.0.0.1')
        const {createNotifications, logger, run} = setup([{...order, email: null}])

        await run()

        expect(createNotifications).not.toHaveBeenCalled()
        expect(logger.warn).toHaveBeenCalled()
    })
})
