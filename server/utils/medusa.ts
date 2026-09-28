import type {H3Event} from 'h3'

export interface MedusaFetchInit {
    method?: string
    query?: Record<string, unknown>
    body?: unknown
    token?: string
    /** Which Medusa API to call. Defaults to 'store'; OAuth routes need 'auth' instead. */
    base?: 'store' | 'auth'
}

/**
 * Calls the Medusa store or auth API from the Nuxt server, authenticated with the publishable key.
 * @param event The incoming H3 event, used to read runtime config
 * @param path Path within the chosen Medusa API, without a leading slash
 * @param init Request method, query, body, bearer token and which Medusa API to call
 * @returns The parsed JSON response, typed as T
 */
export async function medusaFetch<T>(event: H3Event, path: string, init: MedusaFetchInit = {}): Promise<T> {
    const config = useRuntimeConfig(event)
    const base = init.base ?? 'store'

    try {
        // `any` opts out of Nitro's internal route typing, which does not apply to this external URL;
        // the options object needs the same escape, or TS tries to match it against that typed-route system
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return await $fetch<T, any>(`${config.medusaServerUrl}${base}/${path}`, {
            method: init.method,
            query: init.query,
            body: init.body,
            headers: {
                'x-publishable-api-key': config.medusaPublishableKey,
                ...(init.token ? {Authorization: `Bearer ${init.token}`} : {})
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any)
    } catch (error) {
        // A 404 is a normal answer for an unknown product, not a failure worth a log line
        if ((error as {statusCode?: number}).statusCode !== 404) {
            console.error(`Medusa request to ${base}/${path} failed:`, error, (error as {data?: unknown}).data)
        }
        throw error
    }
}
