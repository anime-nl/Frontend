import {createHmac, timingSafeEqual} from 'node:crypto'

/**
 * Signs an order id so its owner can open the order page without an account. The Medusa
 * `order.placed` subscriber computes the same HMAC-SHA256 hex digest for the link in the confirmation email.
 * @param orderId Medusa order id
 * @param secret Shared secret, `ORDER_LINK_SECRET`
 * @returns Hex digest to use as the `token` query parameter
 */
export function signOrderId(orderId: string, secret: string): string {
    return createHmac('sha256', secret).update(orderId).digest('hex')
}

/**
 * Checks that a token was signed for exactly this order. Fails closed when no secret is configured,
 * because an empty secret would make every token forgeable.
 * @param orderId Medusa order id the token is presented for
 * @param token Token from the request, if any
 * @param secret Shared secret, `ORDER_LINK_SECRET`
 * @returns Whether the token is valid for this order
 */
export function isValidOrderToken(orderId: string, token: string | undefined, secret: string | undefined): boolean {
    if (!secret || !token) return false

    const expected = Buffer.from(signOrderId(orderId, secret))
    const actual = Buffer.from(token)
    return actual.length === expected.length && timingSafeEqual(actual, expected)
}
