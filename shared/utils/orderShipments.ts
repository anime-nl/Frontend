export interface OrderFulfillmentLabel {
    tracking_number?: string | null
    tracking_url?: string | null
}

export interface OrderFulfillment {
    shipped_at?: string | Date | null
    canceled_at?: string | Date | null
    labels?: OrderFulfillmentLabel[] | null
}

export interface OrderShipment {
    shippedAt: string | Date
    tracking: {number: string; url?: string}[]
}

/**
 * Lists the shipments of an order for the order page: every fulfillment that has been shipped and not canceled,
 * with the tracking numbers on its labels. Labels without a tracking number are left out.
 * @param fulfillments The order's fulfillments, with their labels
 * @returns One shipment per shipped fulfillment, in the given order
 */
export function getOrderShipments(fulfillments: OrderFulfillment[] | undefined): OrderShipment[] {
    return (fulfillments ?? []).flatMap((fulfillment) => {
        if (!fulfillment.shipped_at || fulfillment.canceled_at) return []
        const tracking = (fulfillment.labels ?? []).flatMap((label) =>
            label.tracking_number ? [{number: label.tracking_number, url: label.tracking_url || undefined}] : []
        )
        return [{shippedAt: fulfillment.shipped_at, tracking}]
    })
}
