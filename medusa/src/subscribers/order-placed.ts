import type {SubscriberArgs, SubscriberConfig} from '@medusajs/framework'
import {ContainerRegistrationKeys, Modules} from '@medusajs/framework/utils'
import {
  ORDER_CONFIRMATION_TEMPLATE,
  buildOrderLink,
  type OrderConfirmationData
} from '../modules/smtp-notification/order-confirmation'

/**
 * Emails the customer a confirmation when an order is placed. Does nothing when SMTP is not configured,
 * so a Medusa without the notification provider keeps working.
 * @param args The `order.placed` event, carrying the order id, and Medusa's container
 */
export default async function orderPlacedHandler({event, container}: SubscriberArgs<{id: string}>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  if (!process.env.SMTP_HOST) {
    logger.warn(`SMTP_HOST is not set, not sending the confirmation email for order ${event.data.id}`)
    return
  }

  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const {
    data: [order]
  } = await query.graph({
    entity: 'order',
    fields: [
      'id',
      'display_id',
      'email',
      'currency_code',
      'item_subtotal',
      'shipping_total',
      'total',
      'items.title',
      'items.product_title',
      'items.quantity',
      'items.total',
      'shipping_address.*'
    ],
    filters: {id: event.data.id}
  })

  if (!order?.email) {
    logger.warn(`Order ${event.data.id} has no email address, not sending a confirmation`)
    return
  }

  const {STOREFRONT_URL: storefrontUrl, ORDER_LINK_SECRET: secret} = process.env
  const address = order.shipping_address
  const data: OrderConfirmationData = {
    displayId: order.display_id ?? order.id,
    currencyCode: order.currency_code,
    items: (order.items ?? []).flatMap((item) =>
      item ? [{title: item.product_title ?? item.title, quantity: Number(item.quantity), total: Number(item.total)}] : []
    ),
    subtotal: Number(order.item_subtotal),
    shippingTotal: Number(order.shipping_total),
    total: Number(order.total),
    shippingAddress: address
      ? {
          name: `${address.first_name ?? ''} ${address.last_name ?? ''}`.trim(),
          line1: address.address_1 ?? '',
          postalCode: address.postal_code ?? '',
          city: address.city ?? ''
        }
      : undefined,
    orderLink: storefrontUrl && secret ? buildOrderLink(storefrontUrl, order.id, secret) : undefined,
    supportEmail: process.env.SUPPORT_EMAIL ?? 'info@animenl.nl'
  }

  await container.resolve(Modules.NOTIFICATION).createNotifications({
    to: order.email,
    channel: 'email',
    template: ORDER_CONFIRMATION_TEMPLATE,
    data: data as unknown as Record<string, unknown>
  })
}

export const config: SubscriberConfig = {event: 'order.placed'}
