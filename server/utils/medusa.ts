import type {H3Event} from 'h3'

export interface MedusaFetchInit {
    method?: string
    query?: Record<string, unknown>
    body?: unknown
    token?: string
}

/** Calls the Medusa store API from the Nuxt server, authenticated with the publishable key. */
export async function medusaFetch<T>(event: H3Event, path: string, init: MedusaFetchInit = {}): Promise<T> {
    const config = useRuntimeConfig(event)

    try {
        // `any` opts out of Nitro's internal route typing, which does not apply to this external URL;
        // the options object needs the same escape, or TS tries to match it against that typed-route system
        return await $fetch<T, any>(`${config.medusaServerUrl}store/${path}`, {
            method: init.method,
            query: init.query,
            body: init.body,
            headers: {
                'x-publishable-api-key': config.medusaPublishableKey,
                ...(init.token ? {Authorization: `Bearer ${init.token}`} : {})
            }
        } as any)
    } catch (error) {
        // A 404 is a normal answer for an unknown product, not a failure worth a log line
        if ((error as {statusCode?: number}).statusCode !== 404) {
            console.error(`Medusa request to store/${path} failed:`, error, (error as {data?: unknown}).data)
        }
        throw error
    }
}
