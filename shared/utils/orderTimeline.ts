export type OrderTimelineKey = 'placed' | 'paid' | 'fulfilled' | 'shipped' | 'delivered'

export interface OrderTimelineStep {
    key: OrderTimelineKey
    state: 'done' | 'current' | 'upcoming'
}

const PAID_PAYMENT_STATUSES = ['captured', 'partially_captured', 'authorized']

/** How far along the fulfillment is, in timeline steps past "paid" (0 = nothing fulfilled yet). */
const FULFILLMENT_PROGRESS: Record<string, number> = {
    fulfilled: 1,
    partially_shipped: 1,
    shipped: 2,
    partially_delivered: 2,
    delivered: 3
}

/**
 * Builds the order timeline shown on the order page: placed, paid, fulfilled, shipped and delivered.
 * Every step before the first unfinished one is done, and that first unfinished step is the current one.
 * @param order The order's Medusa payment and fulfillment statuses
 * @returns The five steps in order, each done, current or upcoming
 */
export function getOrderTimeline(order: {payment_status?: string; fulfillment_status?: string}): OrderTimelineStep[] {
    const paid = PAID_PAYMENT_STATUSES.includes(order.payment_status ?? '')
    const fulfillmentProgress = FULFILLMENT_PROGRESS[order.fulfillment_status ?? ''] ?? 0

    const doneByStep: Record<OrderTimelineKey, boolean> = {
        placed: true,
        paid,
        fulfilled: paid && fulfillmentProgress >= 1,
        shipped: paid && fulfillmentProgress >= 2,
        delivered: paid && fulfillmentProgress >= 3
    }

    const keys = Object.keys(doneByStep) as OrderTimelineKey[]
    const currentKey = keys.find((key) => !doneByStep[key])
    return keys.map((key) => ({key, state: doneByStep[key] ? 'done' : key === currentKey ? 'current' : 'upcoming'}))
}
