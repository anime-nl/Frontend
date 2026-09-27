import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import type {H3Event} from 'h3'

const deleteCookie = vi.fn()

beforeEach(() => {
    vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
    vi.stubGlobal('deleteCookie', deleteCookie)
})

afterEach(() => {
    vi.unstubAllGlobals()
    deleteCookie.mockReset()
})

async function callRoute() {
    const {default: handler} = await import('../../server/api/account/logout.post')
    return (handler as (event: H3Event) => Promise<unknown>)({} as H3Event)
}

describe('POST /api/account/logout', () => {
    it('clears the session cookie', async () => {
        await expect(callRoute()).resolves.toEqual({ok: true})

        expect(deleteCookie).toHaveBeenCalledWith(expect.anything(), 'medusa_session', expect.anything())
    })

    it('does not clear the cart_id cookie', async () => {
        await callRoute()

        expect(deleteCookie).not.toHaveBeenCalledWith(expect.anything(), 'cart_id', expect.anything())
    })
})
