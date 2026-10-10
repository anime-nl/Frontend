import {createHmac} from 'node:crypto'

export const ORDER_CONFIRMATION_TEMPLATE = 'order-confirmation'

export interface OrderConfirmationData {
  displayId: number | string
  currencyCode: string
  items: {title: string; quantity: number; total: number}[]
  subtotal: number
  shippingTotal: number
  total: number
  shippingAddress?: {name: string; line1: string; postalCode: string; city: string}
  orderLink?: string
  supportEmail: string
}

/**
 * Builds the link to the storefront order page. The token is the HMAC-SHA256 hex digest of the order id,
 * which is exactly what the storefront's `server/utils/orderToken.ts` verifies with the same secret.
 * @param storefrontUrl Public URL of the storefront, e.g. https://animenl.nl
 * @param orderId Medusa order id
 * @param secret Shared secret, `ORDER_LINK_SECRET` on both Medusa and the storefront
 * @returns Absolute URL of the order page, including the signed token
 */
export function buildOrderLink(storefrontUrl: string, orderId: string, secret: string): string {
  const token = createHmac('sha256', secret).update(orderId).digest('hex')
  return `${storefrontUrl.replace(/\/+$/, '')}/orders/${orderId}?token=${token}`
}

/**
 * Escapes text for safe inclusion in HTML, because product titles and names are customer-facing input.
 * @param value Raw text
 * @returns The text with HTML special characters escaped
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Renders the Dutch order confirmation email.
 * @param data The order details to show
 * @returns Subject plus HTML and plain-text bodies
 */
export function renderOrderConfirmation(data: OrderConfirmationData): {subject: string; html: string; text: string} {
  const money = (amount: number) =>
    new Intl.NumberFormat('nl-NL', {style: 'currency', currency: data.currencyCode.toUpperCase()}).format(amount)
  const subject = `Bevestiging van je bestelling #${data.displayId}`
  const address = data.shippingAddress
  const addressLines = address ? [address.name, address.line1, `${address.postalCode} ${address.city}`] : []

  const text = [
    `Bedankt voor je bestelling bij AnimeNL! Bestelling #${data.displayId} is geplaatst en betaald.`,
    '',
    ...data.items.map((item) => `${item.quantity}× ${item.title} - ${money(item.total)}`),
    '',
    `Subtotaal: ${money(data.subtotal)}`,
    `Verzending: ${money(data.shippingTotal)}`,
    `Totaal: ${money(data.total)}`,
    ...(addressLines.length ? ['', 'Bezorgadres:', ...addressLines] : []),
    ...(data.orderLink ? ['', `Bekijk de status van je bestelling: ${data.orderLink}`] : []),
    '',
    `Vragen? Mail ons op ${data.supportEmail}.`
  ].join('\n')

  const rows = data.items
    .map(
      (item) =>
        `<tr><td>${item.quantity}× ${escapeHtml(item.title)}</td><td style="text-align:right">${money(item.total)}</td></tr>`
    )
    .join('')
  const html = `<!doctype html>
<html lang="nl"><body style="font-family:sans-serif;color:#111">
<h1>Bedankt voor je bestelling!</h1>
<p>Bestelling #${escapeHtml(String(data.displayId))} is geplaatst en betaald.</p>
<table style="width:100%;border-collapse:collapse">${rows}
<tr><td>Subtotaal</td><td style="text-align:right">${money(data.subtotal)}</td></tr>
<tr><td>Verzending</td><td style="text-align:right">${money(data.shippingTotal)}</td></tr>
<tr><td><strong>Totaal</strong></td><td style="text-align:right"><strong>${money(data.total)}</strong></td></tr>
</table>
${addressLines.length ? `<h2>Bezorgadres</h2><p>${addressLines.map(escapeHtml).join('<br>')}</p>` : ''}
${data.orderLink ? `<p><a href="${escapeHtml(data.orderLink)}">Bekijk de status van je bestelling</a></p>` : ''}
<p>Vragen? Mail ons op <a href="mailto:${escapeHtml(data.supportEmail)}">${escapeHtml(data.supportEmail)}</a>.</p>
</body></html>`

  return {subject, html, text}
}
