import {describe, expect, it, vi} from 'vitest'
import type {H3Event} from 'h3'

const appendResponseHeader = vi.fn()
vi.mock('h3', () => ({appendResponseHeader}))

const {forwardSetCookie} = await import('../../app/utils/forwardSetCookie')

describe('forwardSetCookie', () => {
    it('appends the response cookie onto the outer event', () => {
        const event = {} as H3Event
        const response = new Response(null, {headers: {'set-cookie': 'cart_id=; Path=/; Max-Age=0'}})

        forwardSetCookie(event, response)

        expect(appendResponseHeader).toHaveBeenCalledWith(event, 'set-cookie', 'cart_id=; Path=/; Max-Age=0')
    })

    it('does nothing when there is no outer event (running on the client)', () => {
        const response = new Response(null, {headers: {'set-cookie': 'cart_id=abc'}})

        forwardSetCookie(undefined, response)

        expect(appendResponseHeader).not.toHaveBeenCalled()
    })

    it('does nothing when the response set no cookie', () => {
        const event = {} as H3Event
        const response = new Response(null)

        forwardSetCookie(event, response)

        expect(appendResponseHeader).not.toHaveBeenCalled()
    })
})
