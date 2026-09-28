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

function cartWithItemProfiles(...profileIds: string[]) {
    return {
        cart: {
            items: profileIds.map((profileId) => ({product: {shipping_profile: {id: profileId}}}))
        }
    }
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
function mockMedusa(cartResponse: ReturnType<typeof cartWithItemProfiles>, options = ALL_OPTIONS) {
    medusaFetch.mockImplementation((_event: unknown, path: string) => {
        if (path === 'carts/cart_1') return Promise.resolve(cartResponse)
        if (path === 'shipping-options') return Promise.resolve({shipping_options: options})
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
        mockMedusa(cartWithItemProfiles(BRIEVENBUS_PROFILE_ID, BRIEVENBUS_PROFILE_ID))

        await expect(callRoute()).resolves.toEqual({shipping_options: [BRIEVENBUS_OPTION]})
    })

    it('returns only the Pakket options when every item uses the Pakket profile', async () => {
        mockMedusa(cartWithItemProfiles(PAKKET_PROFILE_ID))

        await expect(callRoute()).resolves.toEqual({shipping_options: [POSTNL_PAKKET_OPTION, DPD_OPTION]})
    })

    it('returns only the Pakket options when the cart mixes Brievenbus and Pakket items', async () => {
        mockMedusa(cartWithItemProfiles(BRIEVENBUS_PROFILE_ID, PAKKET_PROFILE_ID))

        await expect(callRoute()).resolves.toEqual({shipping_options: [POSTNL_PAKKET_OPTION, DPD_OPTION]})
    })

    it('returns every option unfiltered when an item uses a profile that matches neither configured id', async () => {
        mockMedusa(cartWithItemProfiles('sp_some_other_profile'))

        await expect(callRoute()).resolves.toEqual({shipping_options: ALL_OPTIONS})
    })

    it('fetches the cart to resolve its line items shipping profiles', async () => {
        mockMedusa(cartWithItemProfiles(BRIEVENBUS_PROFILE_ID))

        await callRoute()

        expect(medusaFetch).toHaveBeenCalledWith(expect.anything(), 'carts/cart_1', {
            query: {fields: '*items.product.shipping_profile'}
        })
        expect(medusaFetch).toHaveBeenCalledWith(expect.anything(), 'shipping-options', {
            query: {cart_id: 'cart_1'}
        })
    })
})
