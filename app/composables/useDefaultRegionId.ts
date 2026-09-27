/**
 * The first region Medusa returns, used to get a calculated price when nothing more specific is known.
 * @returns Async data wrapping the default region's id
 */
export function useDefaultRegionId() {
    return useFetch('/api/regions', {
        key: 'default-region',
        transform: (data: {regions?: {id: string}[]}) => data.regions?.[0]?.id
    })
}
