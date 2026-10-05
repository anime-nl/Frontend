import type {StoreProduct} from '@medusajs/types'

/** How many other products must be shown before a product may appear in the discovery grid again. */
export const DISCOVERY_MEMORY = 30

/**
 * Returns a randomly ordered copy of the items (Fisher-Yates).
 * @param items The items to shuffle
 * @returns A new, shuffled array; the input is left untouched
 */
export function shuffle<T>(items: readonly T[]): T[] {
    const result = [...items]
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[result[i], result[j]] = [result[j]!, result[i]!]
    }
    return result
}

/**
 * Returns how many shown products the discovery grid remembers. A catalog smaller than
 * DISCOVERY_MEMORY could never show anything new if it remembered every product, so the memory
 * is capped to leave at least one product eligible.
 * @param totalCount The number of products in the catalog
 * @returns The number of most recently shown products that may not be shown again
 */
export function discoveryWindow(totalCount: number): number {
    return Math.max(Math.min(DISCOVERY_MEMORY, totalCount - 1), 0)
}

/**
 * Picks products for the next discovery batch: shuffled, without anything still in memory, and
 * without duplicates.
 * @param candidates Products fetched for this batch
 * @param recentIds Ids of the most recently shown products
 * @returns The candidates that may be shown now, in random order
 */
export function pickUnseenProducts(candidates: readonly StoreProduct[], recentIds: readonly string[]): StoreProduct[] {
    const blocked = new Set(recentIds)
    return shuffle(candidates).filter((product) => {
        if (blocked.has(product.id)) return false
        blocked.add(product.id)
        return true
    })
}

/**
 * Adds freshly shown products to the memory and drops the oldest ones beyond the window.
 * @param recentIds Ids of the most recently shown products, oldest first
 * @param shown Products that were just shown
 * @param window How many ids to remember
 * @returns The updated memory
 */
export function rememberShown(recentIds: readonly string[], shown: readonly StoreProduct[], window: number): string[] {
    if (window <= 0) return []
    return [...recentIds, ...shown.map((product) => product.id)].slice(-window)
}

/**
 * Builds a batch one product at a time, so a product picked early in the batch also counts as
 * recently shown for the picks after it. Stops early when no eligible product is left.
 * @param pool Every product known so far
 * @param recentIds Ids of the most recently shown products, oldest first
 * @param window How many shown products are remembered
 * @param size The batch size to aim for
 * @returns The picked products and the updated memory
 */
export function takeBatch(
    pool: readonly StoreProduct[],
    recentIds: readonly string[],
    window: number,
    size: number
): {batch: StoreProduct[]; recentIds: string[]} {
    const batch: StoreProduct[] = []
    let memory = [...recentIds]

    while (batch.length < size) {
        const [next] = pickUnseenProducts(pool, memory)
        if (!next) break
        batch.push(next)
        memory = rememberShown(memory, [next], window)
    }
    return {batch, recentIds: memory}
}
