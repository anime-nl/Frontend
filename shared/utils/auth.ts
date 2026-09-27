export interface OAuthProvider {
    id: string
    label: string
    icon: string
}

/** The only ways a customer can sign in. There is no password provider, by design. */
export const oauthProviders: OAuthProvider[] = [
    {id: 'google', label: 'Continue with Google', icon: 'i-simple-icons-google'}
]

/**
 * Looks up a supported OAuth provider by id.
 * @param id Provider id, of unknown type since it may come from unvalidated input
 * @returns The matching provider, or undefined if none matches
 */
export const findOAuthProvider = (id: unknown) => oauthProviders.find((provider) => provider.id === id)
