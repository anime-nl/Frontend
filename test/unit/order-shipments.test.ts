import {describe, expect, it} from 'vitest'
import {getOrderShipments} from '#shared/utils/orderShipments'

describe('getOrderShipments', () => {
    it('returns no shipments without fulfillments', () => {
        expect(getOrderShipments(undefined)).toEqual([])
    })

    it('skips fulfillments that are not shipped yet', () => {
        expect(getOrderShipments([{shipped_at: null, labels: [{tracking_number: '3S123'}]}])).toEqual([])
    })

    it('skips canceled fulfillments', () => {
        const fulfillment = {shipped_at: '2026-10-11T09:00:00Z', canceled_at: '2026-10-12T09:00:00Z'}

        expect(getOrderShipments([fulfillment])).toEqual([])
    })

    it('returns the shipped date and tracking number with its link', () => {
        const fulfillment = {
            shipped_at: '2026-10-11T09:00:00Z',
            labels: [{tracking_number: '3S123', tracking_url: 'https://track.example/3S123'}]
        }

        expect(getOrderShipments([fulfillment])).toEqual([
            {shippedAt: '2026-10-11T09:00:00Z', tracking: [{number: '3S123', url: 'https://track.example/3S123'}]}
        ])
    })

    it('leaves out the link when the label has none', () => {
        const fulfillment = {shipped_at: '2026-10-11T09:00:00Z', labels: [{tracking_number: '3S123', tracking_url: ''}]}

        expect(getOrderShipments([fulfillment])[0]!.tracking).toEqual([{number: '3S123', url: undefined}])
    })

    it('ignores labels without a tracking number', () => {
        const fulfillment = {shipped_at: '2026-10-11T09:00:00Z', labels: [{tracking_number: ''}]}

        expect(getOrderShipments([fulfillment])).toEqual([{shippedAt: '2026-10-11T09:00:00Z', tracking: []}])
    })
})
