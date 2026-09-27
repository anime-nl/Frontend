import {describe, expect, it} from 'vitest'
import {isProductionEnv} from '../../shared/utils/env'

describe('isProductionEnv', () => {
    it('is true for "production"', () => {
        expect(isProductionEnv('production')).toBe(true)
    })

    it('is false for "development"', () => {
        expect(isProductionEnv('development')).toBe(false)
    })

    it('is false when NODE_ENV is not set', () => {
        expect(isProductionEnv(undefined)).toBe(false)
    })
})
