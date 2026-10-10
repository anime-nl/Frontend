import type {StoreOrder} from '@medusajs/types'
import {isValidOrderToken} from '../../utils/orderToken'
import {SESSION_COOKIE} from '../../utils/session'

/** Fields the order page needs on top of Medusa's defaults. */
const ORDER_FIELDS =
    '*items,*shipping_address,*shipping_methods,*fulfillments,+payment_status,+fulfillment_status,+email,+created_at'

/**
 * Whether the signed-in customer owns the order. Medusa's customer-scoped order list is the only
 * place the store API checks ownership, so the id is looked up there.
 * @param event The incoming H3 event
 * @param orderId Medusa order id
 * @param sessionToken The customer's session token
 * @returns True when the order is in the customer's own order list
 */
async function customerOwnsOrder(event: Parameters<typeof medusaFetch>[0], orderId: string, sessionToken: string) {
    try {
        const {orders} = await medusaFetch<{orders: {id: string}[]}>(event, 'orders', {
            token: sessionToken,
            query: {id: orderId, fields: 'id'}
        })
        return orders.length > 0
    } catch {
        return false
    }
}

/**
 * GET /api/orders/:id - one order for the order page. Allowed with the signed `token` query parameter
 * from the confirmation email or checkout redirect, or for the signed-in customer who owns the order.
 * Everything else gets a 404, so the response never reveals whether an order id exists.
 * @returns The order with items, address, fulfillments and statuses
 */
export default defineEventHandler(async (event) => {
    const orderId = getRouterParam(event, 'id') ?? ''
    const {token} = getQuery(event)
    const {orderLinkSecret} = useRuntimeConfig(event)

    const sessionToken = getCookie(event, SESSION_COOKIE)
    const allowed =
        isValidOrderToken(orderId, typeof token === 'string' ? token : undefined, orderLinkSecret) ||
        (sessionToken !== undefined && (await customerOwnsOrder(event, orderId, sessionToken)))

    if (!allowed) {
        throw createError({statusCode: 404, statusMessage: 'Order not found'})
    }

    return medusaFetch<{order: StoreOrder}>(event, `orders/${orderId}`, {query: {fields: ORDER_FIELDS}})
})
