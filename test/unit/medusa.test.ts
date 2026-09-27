import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import type {H3Event} from 'h3'
import {medusaFetch} from '../../server/utils/medusa'

const event = {} as H3Event
const fetchMock = vi.fn()

beforeEach(() => {
    vi.stubGlobal('useRuntimeConfig', () => ({
        medusaServerUrl: 'http://medusa:9000/',
        medusaPublishableKey: 'pk_test'
    }))
    vi.stubGlobal('$fetch', fetchMock)
})

afterEach(() => {
    vi.unstubAllGlobals()
    fetchMock.mockReset()
    vi.restoreAllMocks()
})

describe('medusaFetch', () => {
    it('calls the store API with the publishable key and query', async () => {
        fetchMock.mockResolvedValue({regions: []})

        const result = await medusaFetch(event, 'regions', {query: {limit: 1}})

        expect(result).toEqual({regions: []})
        expect(fetchMock).toHaveBeenCalledWith('http://medusa:9000/store/regions', {
            headers: {'x-publishable-api-key': 'pk_test'},
            query: {limit: 1}
        })
    })

    it('sends a POST with a JSON body and no query', async () => {
        fetchMock.mockResolvedValue({cart: {id: 'cart_1'}})

        const result = await medusaFetch(event, 'carts', {method: 'POST', body: {region_id: 'reg_1'}})

        expect(result).toEqual({cart: {id: 'cart_1'}})
        expect(fetchMock).toHaveBeenCalledWith('http://medusa:9000/store/carts', {
            method: 'POST',
            body: {region_id: 'reg_1'},
            headers: {'x-publishable-api-key': 'pk_test'}
        })
    })

    it('adds an Authorization header when a token is given', async () => {
        fetchMock.mockResolvedValue({customer: {id: 'cus_1'}})

        await medusaFetch(event, 'customers/me', {token: 'tok_123'})

        expect(fetchMock).toHaveBeenCalledWith('http://medusa:9000/store/customers/me', {
            headers: {'x-publishable-api-key': 'pk_test', Authorization: 'Bearer tok_123'}
        })
    })

    it('omits the Authorization header when no token is given', async () => {
        fetchMock.mockResolvedValue({regions: []})

        await medusaFetch(event, 'regions')

        const options = fetchMock.mock.calls[0][1]
        expect(options.headers).not.toHaveProperty('Authorization')
    })

    it('calls the auth API instead of the store API when base is auth', async () => {
        fetchMock.mockResolvedValue({location: 'https://accounts.google.com/...'})

        await medusaFetch(event, 'customer/google', {method: 'POST', base: 'auth'})

        expect(fetchMock).toHaveBeenCalledWith('http://medusa:9000/auth/customer/google', {
            method: 'POST',
            headers: {'x-publishable-api-key': 'pk_test'}
        })
    })

    it('passes errors on to the caller', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => {})
        fetchMock.mockRejectedValue(new Error('down'))

        await expect(medusaFetch(event, 'regions')).rejects.toThrow('down')
    })

    it('logs the failure with the path it was for', async () => {
        const cause = new Error('down')
        const log = vi.spyOn(console, 'error').mockImplementation(() => {})
        fetchMock.mockRejectedValue(cause)

        await medusaFetch(event, 'regions').catch(() => {})

        expect(log).toHaveBeenCalledWith(expect.stringContaining('store/regions'), cause, undefined)
    })

    it('logs the response body Medusa explained the failure with', async () => {
        const body = {type: 'invalid_data', message: 'Inventory availability cannot be calculated'}
        const log = vi.spyOn(console, 'error').mockImplementation(() => {})
        fetchMock.mockRejectedValue(Object.assign(new Error('400 Bad Request'), {statusCode: 400, data: body}))

        await medusaFetch(event, 'products/prod_1').catch(() => {})

        expect(log).toHaveBeenCalledWith(expect.any(String), expect.any(Error), body)
    })

    it('does not log a 404', async () => {
        const log = vi.spyOn(console, 'error').mockImplementation(() => {})
        fetchMock.mockRejectedValue({statusCode: 404})

        await medusaFetch(event, 'products/prod_unknown').catch(() => {})

        expect(log).not.toHaveBeenCalled()
    })
})
