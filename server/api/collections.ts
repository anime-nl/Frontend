import type {StoreCollectionListResponse} from '@medusajs/types'

const CACHE_TTL_MS = 5 * 60 * 1000

/**
 * GET /api/collections - lists the store's collections. Cached briefly since the search page
 * fetches this on every visit and collections rarely change.
 * @returns The Medusa collection list, or an empty list if Medusa is unreachable
 */
export default defineEventHandler((event) =>
    withTtlCache('collections', CACHE_TTL_MS, () =>
        medusaFetch<StoreCollectionListResponse>(event, 'collections')
    ).catch(() => ({collections: []}))
)
