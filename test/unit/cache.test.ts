import {afterEach, describe, expect, it, vi} from 'vitest'
import {clearCache, withTtlCache} from '../../server/utils/cache'

afterEach(() => {
    clearCache()
})

describe('withTtlCache', () => {
    it('computes the value on the first call', async () => {
        const compute = vi.fn().mockResolvedValue('fresh')

        await expect(withTtlCache('key', 1000, compute, 0)).resolves.toBe('fresh')
        expect(compute).toHaveBeenCalledTimes(1)
    })

    it('reuses the cached value for a second call within the TTL', async () => {
        const compute = vi.fn().mockResolvedValue('fresh')

        await withTtlCache('key', 1000, compute, 0)
        await withTtlCache('key', 1000, compute, 500)

        expect(compute).toHaveBeenCalledTimes(1)
    })

    it('recomputes once the TTL has expired', async () => {
        const compute = vi.fn().mockResolvedValue('fresh')

        await withTtlCache('key', 1000, compute, 0)
        await withTtlCache('key', 1000, compute, 1001)

        expect(compute).toHaveBeenCalledTimes(2)
    })

    it('keeps separate cache entries per key', async () => {
        const compute = vi.fn().mockResolvedValue('fresh')

        await withTtlCache('key-a', 1000, compute, 0)
        await withTtlCache('key-b', 1000, compute, 0)

        expect(compute).toHaveBeenCalledTimes(2)
    })

    it('does not cache a rejected compute, so the next call tries again', async () => {
        const compute = vi.fn().mockRejectedValueOnce(new Error('down')).mockResolvedValueOnce('fresh')

        await expect(withTtlCache('key', 1000, compute, 0)).rejects.toThrow('down')
        await expect(withTtlCache('key', 1000, compute, 1)).resolves.toBe('fresh')
        expect(compute).toHaveBeenCalledTimes(2)
    })

    it('clearCache forces the next call to recompute', async () => {
        const compute = vi.fn().mockResolvedValue('fresh')

        await withTtlCache('key', 1000, compute, 0)
        clearCache()
        await withTtlCache('key', 1000, compute, 0)

        expect(compute).toHaveBeenCalledTimes(2)
    })
})
