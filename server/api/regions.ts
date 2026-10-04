import type {StoreRegionListResponse} from '@medusajs/types'

const CACHE_TTL_MS = 5 * 60 * 1000

/**
 * GET /api/regions - lists the store's regions. Cached briefly since this is fetched on nearly
 * every page (product cards, category pages, search, checkout) and the region list rarely changes.
 * @returns The Medusa region list, or an empty list if Medusa is unreachable
 */
export default defineEventHandler((event) =>
    withTtlCache('regions', CACHE_TTL_MS, () =>
        medusaFetch<StoreRegionListResponse>(event, 'regions').catch(() => ({regions: []}))
    )
)
