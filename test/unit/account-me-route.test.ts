import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import type {H3Event} from 'h3'

const medusaFetch = vi.fn()
const getCookie = vi.fn()
const deleteCookie = vi.fn()

beforeEach(() => {
    vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
    vi.stubGlobal('createError', (input: object) => Object.assign(new Error(), input))
    vi.stubGlobal('medusaFetch', medusaFetch)
    vi.stubGlobal('getCookie', getCookie)
    vi.stubGlobal('deleteCookie', deleteCookie)
})

afterEach(() => {
    vi.unstubAllGlobals()
    medusaFetch.mockReset()
    getCookie.mockReset()
    deleteCookie.mockReset()
})

async function callRoute() {
    const {default: handler} = await import('../../server/api/account/me.get')
    return (handler as (event: H3Event) => Promise<unknown>)({} as H3Event)
}

describe('GET /api/account/me', () => {
    it('answers 401 with no session cookie', async () => {
        getCookie.mockReturnValue(undefined)

        await expect(callRoute()).rejects.toMatchObject({statusCode: 401})
        expect(medusaFetch).not.toHaveBeenCalled()
    })

    it('returns the customer for a valid session', async () => {
        getCookie.mockReturnValue('tok_123')
        medusaFetch.mockResolvedValue({customer: {id: 'cus_1', email: 'jan@example.nl'}})

        await expect(callRoute()).resolves.toEqual({customer: {id: 'cus_1', email: 'jan@example.nl'}})
        expect(medusaFetch).toHaveBeenCalledWith(expect.anything(), 'customers/me', {token: 'tok_123'})
    })

    it('clears the cookie and answers 401 when Medusa rejects the token', async () => {
        getCookie.mockReturnValue('tok_stale')
        medusaFetch.mockRejectedValue({statusCode: 401})

        await expect(callRoute()).rejects.toMatchObject({statusCode: 401})
        expect(deleteCookie).toHaveBeenCalledWith(expect.anything(), 'medusa_session', expect.anything())
    })

    it('clears the cookie when Medusa rejects with a 401 response instead of a statusCode', async () => {
        getCookie.mockReturnValue('tok_stale')
        medusaFetch.mockRejectedValue({response: {status: 401}})

        await expect(callRoute()).rejects.toMatchObject({statusCode: 401})
        expect(deleteCookie).toHaveBeenCalledWith(expect.anything(), 'medusa_session', expect.anything())
    })

    it('does not clear the cookie when Medusa fails for an unrelated reason', async () => {
        getCookie.mockReturnValue('tok_valid')
        medusaFetch.mockRejectedValue({statusCode: 500})

        await expect(callRoute()).rejects.toMatchObject({statusCode: 401})
        expect(deleteCookie).not.toHaveBeenCalled()
    })
})
