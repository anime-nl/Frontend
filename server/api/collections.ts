import type {StoreCollectionListResponse} from '@medusajs/types'

export default defineEventHandler((event) =>
    medusaFetch<StoreCollectionListResponse>(event, 'collections').catch(() => ({collections: []}))
)
