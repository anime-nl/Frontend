import {describe, expect, it} from 'vitest'
import {findOAuthProvider, oauthProviders} from '../../shared/utils/auth'

describe('oauthProviders', () => {
    it('lists Google as a provider', () => {
        expect(oauthProviders.map((provider) => provider.id)).toContain('google')
    })
})

describe('findOAuthProvider', () => {
    it('finds a provider by id', () => {
        expect(findOAuthProvider('google')?.id).toBe('google')
    })

    it('returns undefined for an unknown provider', () => {
        expect(findOAuthProvider('facebook')).toBeUndefined()
    })

    it('returns undefined for a non-string input', () => {
        expect(findOAuthProvider(undefined)).toBeUndefined()
    })
})
