import type {StoreCollection} from '@medusajs/types'

/**
 * Lists the store's collections, used to populate the search page's collection filter. A plain
 * async function rather than reactive state, since the search page only needs this once, as part
 * of its own client-only initial load (see search/index.vue's onMounted).
 * @returns The collection list
 */
export async function fetchCollections(): Promise<StoreCollection[]> {
    const {collections} = await $fetch<{collections: StoreCollection[]}>('/api/collections')
    return collections
}
