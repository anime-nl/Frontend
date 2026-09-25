import type {StoreRegionListResponse} from '@medusajs/types'

export default defineEventHandler((event) =>
    medusaFetch<StoreRegionListResponse>(event, 'regions').catch(() => ({regions: []}))
)
