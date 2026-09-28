export interface OAuthProvider {
    id: string
    label: string
    icon: string
}

/** The only ways a customer can sign in. There is no password provider, by design. */
export const oauthProviders: OAuthProvider[] = [
    {id: 'google', label: 'Continue with Google', icon: 'i-simple-icons-google'}
]

export const findOAuthProvider = (id: unknown) => oauthProviders.find((provider) => provider.id === id)
