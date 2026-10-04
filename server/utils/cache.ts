interface CacheEntry {
    value: unknown
    expiresAt: number
}

const cache = new Map<string, CacheEntry>()

/**
 * Memoizes an async computation for a short time, so repeated calls for the same key return the
 * cached result instead of re-running it. Held in memory only, which matches the single-VPS
 * deployment (see server/utils/rateLimit.ts).
 * @param key Identifies the cached value
 * @param ttlMs How long a cached value stays valid, in milliseconds
 * @param compute Produces the value when nothing cached is still valid
 * @param now Current time in epoch ms, defaults to Date.now() (overridable for tests)
 * @returns The cached or freshly computed value
 */
export async function withTtlCache<T>(
    key: string,
    ttlMs: number,
    compute: () => Promise<T>,
    now: number = Date.now()
): Promise<T> {
    const cached = cache.get(key)
    if (cached && cached.expiresAt > now) {
        return cached.value as T
    }

    const value = await compute()
    cache.set(key, {value, expiresAt: now + ttlMs})
    return value
}

/**
 * Clears every cached value, exposed only so tests can start each case without a cache entry left
 * over from a previous one.
 */
export function clearCache(): void {
    cache.clear()
}
