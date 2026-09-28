import type {StoreRegionListResponse} from '@medusajs/types'

/**
 * GET /api/regions - lists the store's regions.
 * @returns The Medusa region list, or an empty list if Medusa is unreachable
 */
export default defineEventHandler((event) =>
    medusaFetch<StoreRegionListResponse>(event, 'regions').catch(() => ({regions: []}))
)
