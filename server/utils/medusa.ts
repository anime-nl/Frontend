import type {H3Event} from 'h3'

/** Calls the Medusa store API from the Nuxt server, authenticated with the publishable key. */
export async function medusaFetch<T>(event: H3Event, path: string, query?: Record<string, unknown>): Promise<T> {
    const config = useRuntimeConfig(event)

    try {
        // `any` opts out of Nitro's internal route typing, which does not apply to this external URL
        return await $fetch<T, any>(`${config.medusaServerUrl}store/${path}`, {
            headers: {'x-publishable-api-key': config.medusaPublishableKey},
            query
        })
    } catch (error) {
        // A 404 is a normal answer for an unknown product, not a failure worth a log line
        if ((error as {statusCode?: number}).statusCode !== 404) {
            console.error(`Medusa request to store/${path} failed:`, error)
        }
        throw error
    }
}
