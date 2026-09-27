const requestTimestamps = new Map<string, number[]>()

/**
 * A simple in-memory fixed-window rate limiter, keyed by caller (e.g. IP address).
 * Only holds up for a single server instance, which matches the one-VPS deployment.
 */
export function isRateLimited(key: string, opts: {limit: number; windowMs: number; now?: number}): boolean {
    const now = opts.now ?? Date.now()
    const windowStart = now - opts.windowMs

    const timestamps = (requestTimestamps.get(key) ?? []).filter((timestamp) => timestamp > windowStart)
    timestamps.push(now)
    requestTimestamps.set(key, timestamps)

    return timestamps.length > opts.limit
}
