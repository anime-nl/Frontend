import {describe, expect, it} from 'vitest'
import {isValidOrderToken, signOrderId} from '../../server/utils/orderToken'

const secret = 'test-secret'

describe('signOrderId', () => {
    it('is deterministic for the same order and secret', () => {
        expect(signOrderId('order_1', secret)).toBe(signOrderId('order_1', secret))
    })

    it('differs per order', () => {
        expect(signOrderId('order_1', secret)).not.toBe(signOrderId('order_2', secret))
    })

    it('differs per secret', () => {
        expect(signOrderId('order_1', secret)).not.toBe(signOrderId('order_1', 'other-secret'))
    })
})

describe('isValidOrderToken', () => {
    it('accepts the token signed for that order', () => {
        expect(isValidOrderToken('order_1', signOrderId('order_1', secret), secret)).toBe(true)
    })

    it('rejects a token signed for another order', () => {
        expect(isValidOrderToken('order_2', signOrderId('order_1', secret), secret)).toBe(false)
    })

    it('rejects a tampered token', () => {
        const token = signOrderId('order_1', secret)
        const tampered = `${token.slice(0, -1)}${token.endsWith('0') ? '1' : '0'}`

        expect(isValidOrderToken('order_1', tampered, secret)).toBe(false)
    })

    it('rejects a token of the wrong length without throwing', () => {
        expect(isValidOrderToken('order_1', 'abc', secret)).toBe(false)
    })

    it('rejects a missing token', () => {
        expect(isValidOrderToken('order_1', undefined, secret)).toBe(false)
    })

    it('rejects everything when no secret is configured', () => {
        expect(isValidOrderToken('order_1', signOrderId('order_1', ''), undefined)).toBe(false)
        expect(isValidOrderToken('order_1', signOrderId('order_1', ''), '')).toBe(false)
    })
})
