import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import type {H3Event} from 'h3'

const medusaFetch = vi.fn()
let provider: string

beforeEach(() => {
    provider = 'google'
    vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
    vi.stubGlobal('getRouterParam', () => provider)
    vi.stubGlobal('createError', (input: object) => Object.assign(new Error(), input))
    vi.stubGlobal('medusaFetch', medusaFetch)
})

afterEach(() => {
    vi.unstubAllGlobals()
    medusaFetch.mockReset()
})

async function callRoute() {
    const {default: handler} = await import('../../server/api/auth/[provider]/start.post')
    return (handler as (event: H3Event) => Promise<unknown>)({} as H3Event)
}

describe('POST /api/auth/:provider/start', () => {
    it('returns the redirect location for a known provider', async () => {
        medusaFetch.mockResolvedValue({location: 'https://accounts.google.com/o/oauth2/auth?client_id=...'})

        await expect(callRoute()).resolves.toEqual({
            location: 'https://accounts.google.com/o/oauth2/auth?client_id=...'
        })
        expect(medusaFetch).toHaveBeenCalledWith(expect.anything(), 'customer/google', {method: 'POST', base: 'auth'})
    })

    it('rejects an unknown provider', async () => {
        provider = 'facebook'

        await expect(callRoute()).rejects.toMatchObject({statusCode: 400})
        expect(medusaFetch).not.toHaveBeenCalled()
    })
})
