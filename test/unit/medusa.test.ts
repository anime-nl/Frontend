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

        const result = await medusaFetch(event, 'regions', {limit: 1})

        expect(result).toEqual({regions: []})
        expect(fetchMock).toHaveBeenCalledWith('http://medusa:9000/store/regions', {
            headers: {'x-publishable-api-key': 'pk_test'},
            query: {limit: 1}
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

        expect(log).toHaveBeenCalledWith(expect.stringContaining('store/regions'), cause)
    })

    it('does not log a 404', async () => {
        const log = vi.spyOn(console, 'error').mockImplementation(() => {})
        fetchMock.mockRejectedValue({statusCode: 404})

        await medusaFetch(event, 'products/prod_unknown').catch(() => {})

        expect(log).not.toHaveBeenCalled()
    })
})
