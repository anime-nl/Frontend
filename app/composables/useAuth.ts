/**
 * OAuth sign-in actions: starting a provider's flow, completing its callback, and logging out.
 * @returns The auth action methods
 */
export function useAuth() {
    /**
     * Starts an OAuth provider's sign-in flow.
     * @param providerId OAuth provider id
     * @returns The URL to redirect the customer to
     */
    async function signInStart(providerId: string): Promise<string> {
        const {location} = await $fetch<{location: string}>(`/api/auth/${providerId}/start`, {method: 'POST'})
        return location
    }

    /**
     * Completes an OAuth provider's callback, exchanging it for a session.
     * @param provider OAuth provider id
     * @param query The callback's query params, forwarded to the server as-is
     */
    async function handleCallback(provider: string, query: Record<string, unknown>): Promise<void> {
        await $fetch(`/api/auth/${provider}/callback`, {method: 'POST', body: query})
    }

    /**
     * Ends the customer's session.
     */
    async function logout(): Promise<void> {
        await $fetch('/api/account/logout', {method: 'POST'})
    }

    return {signInStart, handleCallback, logout}
}
