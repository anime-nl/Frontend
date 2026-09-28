import {describe, expect, it} from 'vitest'
import {decodeJwtPayload} from '../../server/utils/session'

function fakeJwt(payload: Record<string, unknown>): string {
    const base64url = (value: string) => Buffer.from(value).toString('base64url')
    return `${base64url('{"alg":"HS256"}')}.${base64url(JSON.stringify(payload))}.signature`
}

describe('decodeJwtPayload', () => {
    it('decodes the payload of a JWT', () => {
        const token = fakeJwt({actor_id: 'cus_1', user_metadata: {email: 'jan@example.nl'}})

        expect(decodeJwtPayload(token)).toEqual({actor_id: 'cus_1', user_metadata: {email: 'jan@example.nl'}})
    })

    it('returns an empty object for a malformed token', () => {
        expect(decodeJwtPayload('not-a-jwt')).toEqual({})
    })

    it('returns an empty object for a token whose payload is not valid JSON', () => {
        const token = `${Buffer.from('{}').toString('base64url')}.${Buffer.from('not json').toString('base64url')}.sig`

        expect(decodeJwtPayload(token)).toEqual({})
    })
})
