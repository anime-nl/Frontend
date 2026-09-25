import type {H3Event} from 'h3'

/** Calls the Medusa store API from the Nuxt server, authenticated with the publishable key. */
export function medusaFetch<T>(event: H3Event, path: string, query?: Record<string, unknown>): Promise<T> {
    const config = useRuntimeConfig(event)

    // `any` opts out of Nitro's internal route typing, which does not apply to this external URL
    return $fetch<T, any>(`${config.medusaServerUrl}store/${path}`, {
        headers: {'x-publishable-api-key': config.medusaPublishableKey},
        query
    })
}
