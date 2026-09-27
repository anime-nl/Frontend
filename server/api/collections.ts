import type {StoreCollectionListResponse} from '@medusajs/types'

/**
 * GET /api/collections - lists the store's collections.
 * @returns The Medusa collection list, or an empty list if Medusa is unreachable
 */
export default defineEventHandler((event) =>
    medusaFetch<StoreCollectionListResponse>(event, 'collections').catch(() => ({collections: []}))
)
