import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import type {H3Event} from 'h3'

const medusaFetch = vi.fn()
const getCookie = vi.fn()
const useRuntimeConfig = vi.fn()

const BRIEVENBUS_PROFILE_ID = 'sp_brievenbus'
const PAKKET_PROFILE_ID = 'sp_pakket'

const BRIEVENBUS_OPTION = {
    id: 'so_brievenbus',
    name: 'PostNL Brievenbuspakje',
    shipping_profile_id: BRIEVENBUS_PROFILE_ID
}
const POSTNL_PAKKET_OPTION = {id: 'so_postnl_pakket', name: 'PostNL Pakket', shipping_profile_id: PAKKET_PROFILE_ID}
const DPD_OPTION = {id: 'so_dpd', name: 'DPD', shipping_profile_id: PAKKET_PROFILE_ID}
const ALL_OPTIONS = [BRIEVENBUS_OPTION, POSTNL_PAKKET_OPTION, DPD_OPTION]

/** Builds one cart item + matching `/store/products/shipping-profiles` entry per given profile id. */
function itemsWithProfiles(...profileIds: string[]) {
    return profileIds.map((profileId, index) => ({productId: `prod_${index}`, profileId}))
}

beforeEach(() => {
    vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
    vi.stubGlobal('createError', (input: object) => Object.assign(new Error(), input))
    vi.stubGlobal('medusaFetch', medusaFetch)
    vi.stubGlobal('getCookie', getCookie)
    vi.stubGlobal('useRuntimeConfig', useRuntimeConfig)
    useRuntimeConfig.mockReturnValue({
        medusaBrievenbusShippingProfileId: BRIEVENBUS_PROFILE_ID,
        medusaPakketShippingProfileId: PAKKET_PROFILE_ID
    })
    getCookie.mockReturnValue('cart_1')
})

afterEach(() => {
    vi.unstubAllGlobals()
    medusaFetch.mockReset()
    getCookie.mockReset()
    useRuntimeConfig.mockReset()
})

async function callRoute() {
    const {default: handler} = await import('../../server/api/checkout/shipping-options.get')
    return (handler as (event: H3Event) => Promise<unknown>)({} as H3Event)
}

/** Routes the stubbed medusaFetch by path, mirroring what the real Medusa store API returns for each call. */
function mockMedusa(items: ReturnType<typeof itemsWithProfiles>, options = ALL_OPTIONS) {
    medusaFetch.mockImplementation((_event: unknown, path: string) => {
        if (path === 'carts/cart_1') {
            return Promise.resolve({cart: {items: items.map(({productId}) => ({product_id: productId}))}})
        }
        if (path === 'shipping-options') return Promise.resolve({shipping_options: options})
        if (path === 'products/shipping-profiles') {
            return Promise.resolve({
                shipping_profiles: items.map(({productId, profileId}) => ({
                    product_id: productId,
                    shipping_profile_id: profileId
                }))
            })
        }
        throw new Error(`Unexpected medusaFetch path: ${path}`)
    })
}

describe('GET /api/checkout/shipping-options', () => {
    it('requires an existing cart', async () => {
        getCookie.mockReturnValue(undefined)

        await expect(callRoute()).rejects.toMatchObject({statusCode: 400, statusMessage: 'No cart'})
        expect(medusaFetch).not.toHaveBeenCalled()
    })

    it('returns only the Brievenbus options when every item uses the Brievenbus profile', async () => {
        mockMedusa(itemsWithProfiles(BRIEVENBUS_PROFILE_ID, BRIEVENBUS_PROFILE_ID))

        await expect(callRoute()).resolves.toEqual({shipping_options: [BRIEVENBUS_OPTION]})
    })

    it('returns only the Pakket options when every item uses the Pakket profile', async () => {
        mockMedusa(itemsWithProfiles(PAKKET_PROFILE_ID))

        await expect(callRoute()).resolves.toEqual({shipping_options: [POSTNL_PAKKET_OPTION, DPD_OPTION]})
    })

    it('returns only the Pakket options when the cart mixes Brievenbus and Pakket items', async () => {
        mockMedusa(itemsWithProfiles(BRIEVENBUS_PROFILE_ID, PAKKET_PROFILE_ID))

        await expect(callRoute()).resolves.toEqual({shipping_options: [POSTNL_PAKKET_OPTION, DPD_OPTION]})
    })

    it('returns every option unfiltered when an item uses a profile that matches neither configured id', async () => {
        mockMedusa(itemsWithProfiles('sp_some_other_profile'))

        await expect(callRoute()).resolves.toEqual({shipping_options: ALL_OPTIONS})
    })

    it("fetches the cart and each item product's shipping profile to resolve the winning profile", async () => {
        mockMedusa(itemsWithProfiles(BRIEVENBUS_PROFILE_ID))

        await callRoute()

        expect(medusaFetch).toHaveBeenCalledWith(expect.anything(), 'carts/cart_1', {
            query: {fields: 'items.product_id'}
        })
        expect(medusaFetch).toHaveBeenCalledWith(expect.anything(), 'shipping-options', {
            query: {cart_id: 'cart_1'}
        })
        expect(medusaFetch).toHaveBeenCalledWith(expect.anything(), 'products/shipping-profiles', {
            query: {id: ['prod_0']}
        })
    })

    it('does not look up shipping profiles for an empty cart', async () => {
        mockMedusa(itemsWithProfiles())

        await callRoute()

        expect(medusaFetch).not.toHaveBeenCalledWith(expect.anything(), 'products/shipping-profiles', expect.anything())
    })
})
