const requestTimestamps = new Map<string, number[]>()

/**
 * A simple in-memory fixed-window rate limiter, keyed by caller (e.g. IP address).
 * Only holds up for a single server instance, which matches the one-VPS deployment.
 * @param key Identifies the caller being rate limited, e.g. an IP address
 * @param opts.limit Maximum number of requests allowed within the window
 * @param opts.windowMs Length of the sliding window in milliseconds
 * @param opts.now Current time in epoch ms, defaults to Date.now() (overridable for tests)
 * @returns Whether this call pushes the caller over the limit
 */
export function isRateLimited(key: string, opts: {limit: number; windowMs: number; now?: number}): boolean {
    const now = opts.now ?? Date.now()
    const windowStart = now - opts.windowMs

    // A caller that never comes back would otherwise sit in the map forever, since only its own
    // next request would prune it - sweeping on every call bounds memory to callers seen within
    // the window, regardless of which key triggers the sweep.
    for (const [otherKey, timestamps] of requestTimestamps) {
        const stillValid = timestamps.filter((timestamp) => timestamp > windowStart)
        if (stillValid.length === 0) {
            requestTimestamps.delete(otherKey)
        } else if (stillValid.length !== timestamps.length) {
            requestTimestamps.set(otherKey, stillValid)
        }
    }

    const timestamps = (requestTimestamps.get(key) ?? []).filter((timestamp) => timestamp > windowStart)
    timestamps.push(now)
    requestTimestamps.set(key, timestamps)

    return timestamps.length > opts.limit
}

/**
 * Whether a caller still has any requests being tracked, exposed only so tests can verify that
 * inactive callers get swept instead of accumulating in memory forever.
 * @param key The caller key to check
 * @returns Whether the key currently has any tracked timestamps
 */
export function isCallerTracked(key: string): boolean {
    return requestTimestamps.has(key)
}
