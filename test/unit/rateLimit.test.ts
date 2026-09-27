import {describe, expect, it} from 'vitest'
import {isRateLimited} from '../../server/utils/rateLimit'

describe('isRateLimited', () => {
    it('allows requests up to the limit', () => {
        const key = 'allows-up-to-limit'

        expect(isRateLimited(key, {limit: 3, windowMs: 1000, now: 0})).toBe(false)
        expect(isRateLimited(key, {limit: 3, windowMs: 1000, now: 1})).toBe(false)
        expect(isRateLimited(key, {limit: 3, windowMs: 1000, now: 2})).toBe(false)
    })

    it('blocks a request once the limit is exceeded within the window', () => {
        const key = 'blocks-over-limit'

        isRateLimited(key, {limit: 2, windowMs: 1000, now: 0})
        isRateLimited(key, {limit: 2, windowMs: 1000, now: 1})

        expect(isRateLimited(key, {limit: 2, windowMs: 1000, now: 2})).toBe(true)
    })

    it('allows requests again once the window has passed', () => {
        const key = 'resets-after-window'

        isRateLimited(key, {limit: 1, windowMs: 1000, now: 0})
        expect(isRateLimited(key, {limit: 1, windowMs: 1000, now: 1001})).toBe(false)
    })

    it('tracks separate keys independently', () => {
        isRateLimited('key-a', {limit: 1, windowMs: 1000, now: 0})

        expect(isRateLimited('key-b', {limit: 1, windowMs: 1000, now: 0})).toBe(false)
    })
})
