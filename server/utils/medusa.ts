import type {H3Event} from 'h3'

/** Calls the Medusa store API from the Nuxt server, authenticated with the publishable key. */
export function medusaFetch<T>(event: H3Event, path: string, query?: Record<string, unknown>) {
    const config = useRuntimeConfig(event)

    return $fetch<T>(`${config.medusaServerUrl}store/${path}`, {
        headers: {'x-publishable-api-key': config.medusaPublishableKey},
        query
    })
}
