import {createServer} from 'node:http'
import type {AddressInfo} from 'node:net'
import {afterAll, describe, expect, it} from 'vitest'
import {fetch, setup} from '@nuxt/test-utils/e2e'

const fakeMedusa = createServer((request, response) => {
    response.setHeader('content-type', 'application/json')
    if (request.url?.includes('/complete')) {
        response.end(JSON.stringify({type: 'order', order: {id: 'order_1', display_id: 42}}))
        return
    }
    response.end(JSON.stringify({cart: null}))
})
await new Promise<void>((resolve) => fakeMedusa.listen(0, '127.0.0.1', resolve))
const medusaPort = (fakeMedusa.address() as AddressInfo).port

await setup({
    server: true,
    nuxtConfig: {
        runtimeConfig: {medusaServerUrl: `http://127.0.0.1:${medusaPort}/`, orderLinkSecret: 'test-secret'}
    }
})

afterAll(() => fakeMedusa.close())

describe('checkout return page with a completed order', () => {
    it('redirects to the order page instead of failing with a server error', async () => {
        const response = await fetch('/checkout/return', {headers: {cookie: 'cart_id=cart_1'}, redirect: 'manual'})

        expect(response.status).toBe(302)
        expect(response.headers.get('location')).toMatch(/\/orders\/order_1\?token=[0-9a-f]{64}$/)
    })
})
