import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {mockNuxtImport, mountSuspended, registerEndpoint} from '@nuxt/test-utils/runtime'
import {createError, readBody} from 'h3'
import CartPage from '~/pages/cart/index.vue'

const fakeRequestEvent = vi.hoisted(() => ({marker: 'fake-request-event'}))
const forwardSetCookieMock = vi.hoisted(() => vi.fn())
mockNuxtImport('useRequestEvent', () => () => fakeRequestEvent)
mockNuxtImport('forwardSetCookie', () => forwardSetCookieMock)

const cartWithItems = {
    id: 'cart_1',
    currency_code: 'eur',
    subtotal: 18.0,
    tax_total: 3.8,
    item_subtotal: 18.0,
    original_item_tax_total: 3.8,
    discount_total: 0,
    item_total: 21.8,
    total: 21.8,
    promotions: [] as {id: string; code: string | null; is_automatic?: boolean}[],
    items: [
        {
            id: 'item_1',
            title: 'Acrylic Zhongli Keychain',
            thumbnail: 'https://example.com/zhongli.jpg',
            variant_title: 'Default',
            quantity: 2,
            unit_price: 10.9
        }
    ]
}

let cart: typeof cartWithItems | null = cartWithItems
let lastPutBody: unknown
let lastDeletedItemId: string | undefined
let lastPromotionBody: unknown
let applyShouldFail = false
let applyFailureStatusMessage = 'That promo code is not valid.'
let applyFailureCode: string | undefined
let removeShouldFail = false

registerEndpoint('/api/cart', () => ({cart}))
registerEndpoint('/api/cart/promotions', {
    method: 'POST',
    handler: async (event) => {
        lastPromotionBody = await readBody(event)
        if (applyShouldFail) {
            throw createError({
                statusCode: 400,
                statusMessage: applyFailureStatusMessage,
                data: applyFailureCode ? {code: applyFailureCode} : undefined
            })
        }
        cart = {...cartWithItems, promotions: [{id: 'promo_1', code: (lastPromotionBody as {code: string}).code}]}
        return {cart}
    }
})
registerEndpoint('/api/cart/promotions', {
    method: 'DELETE',
    handler: async (event) => {
        lastPromotionBody = await readBody(event)
        if (removeShouldFail) throw createError({statusCode: 500, statusMessage: 'Could not remove promo code'})
        cart = {...cartWithItems, promotions: []}
        return {cart}
    }
})
registerEndpoint('/api/cart/items/item_1', {
    method: 'PUT',
    handler: async (event) => {
        lastPutBody = await readBody(event)
        return {
            cart: {
                ...cartWithItems,
                items: [{...cartWithItems.items[0]!, quantity: (lastPutBody as {quantity: number}).quantity}]
            }
        }
    }
})
registerEndpoint('/api/cart/items/item_1', {
    method: 'DELETE',
    handler: () => {
        lastDeletedItemId = 'item_1'
        return {cart: {...cartWithItems, items: []}}
    }
})

const eur = (amount: number) => new Intl.NumberFormat('nl-NL', {style: 'currency', currency: 'EUR'}).format(amount)
const mountCart = () => mountSuspended(CartPage)

let wrapper: Awaited<ReturnType<typeof mountCart>> | undefined

beforeEach(() => {
    cart = cartWithItems
    lastPutBody = undefined
    lastDeletedItemId = undefined
    lastPromotionBody = undefined
    applyShouldFail = false
    applyFailureStatusMessage = 'That promo code is not valid.'
    applyFailureCode = undefined
    removeShouldFail = false
    forwardSetCookieMock.mockClear()
})

afterEach(() => {
    wrapper?.unmount()
})

describe('cart page', () => {
    it('shows every line item with its quantity and price', async () => {
        wrapper = await mountCart()

        expect(wrapper.text()).toContain('Acrylic Zhongli Keychain')
        const quantityInput = wrapper.findComponent({name: 'UInputNumber'})
        expect(quantityInput.props('modelValue')).toBe(2)
        expect(wrapper.text()).toContain(eur(10.9))
    })

    it('stacks a line item vertically on narrow screens instead of overflowing', async () => {
        wrapper = await mountCart()

        const row = wrapper.findComponent({name: 'UInputNumber'}).element.closest('[class*="flex-col"]')
        expect(row?.className).toContain('flex-col')
        expect(row?.className).toContain('sm:flex-row')
    })

    it('shows the price excl. VAT, the VAT amount, the incl.-VAT subtotal and the total', async () => {
        wrapper = await mountCart()

        expect(wrapper.text()).toContain('Prijs excl. btw')
        expect(wrapper.text()).toContain(eur(18.0))
        expect(wrapper.text()).toContain('Btw')
        expect(wrapper.text()).toContain(eur(3.8))
        expect(wrapper.text()).toContain('Subtotaal')
        expect(wrapper.text()).toContain('Totaal')
        expect(wrapper.text()).toContain(eur(21.8))
    })

    it('does not show a discount row when there is no discount', async () => {
        wrapper = await mountCart()

        expect(wrapper.text()).not.toContain('Korting')
    })

    it('shows a discount row, and the breakdown rows reconcile, when a discount is applied', async () => {
        // A 10% promo code on a 100.00 excl.-VAT, 21% item: excl. VAT + VAT - discount = subtotal.
        cart = {
            ...cartWithItems,
            item_subtotal: 100.0,
            original_item_tax_total: 21.0,
            discount_total: 12.1,
            item_total: 108.9,
            total: 108.9
        }
        wrapper = await mountCart()

        expect(wrapper.text()).toContain(eur(100.0))
        expect(wrapper.text()).toContain(eur(21.0))
        expect(wrapper.text()).toContain('Korting')
        expect(wrapper.text()).toContain(eur(12.1))
        expect(wrapper.text()).toContain(eur(108.9))
    })

    it('does not show a variant line for an item with no variant title', async () => {
        cart = {...cartWithItems, items: [{...cartWithItems.items[0]!, variant_title: null as unknown as string}]}
        wrapper = await mountCart()

        expect(wrapper.text()).not.toContain('Default')
    })

    it('shows the empty-cart state when the cart has no items', async () => {
        cart = {...cartWithItems, items: []}
        wrapper = await mountCart()

        expect(wrapper.text().toLowerCase()).toContain('leeg')
    })

    it('removing an item calls the delete endpoint', async () => {
        wrapper = await mountCart()

        const removeButton = wrapper!
            .findAllComponents({name: 'UButton'})
            .find((button) => button.props('icon') === 'i-lucide-trash-2')
        await removeButton!.trigger('click')

        await vi.waitFor(() => expect(lastDeletedItemId).toBe('item_1'))
    })

    it('updating the quantity calls the update endpoint', async () => {
        wrapper = await mountCart()

        const quantityInput = wrapper.findComponent({name: 'UInputNumber'})
        await quantityInput.vm.$emit('update:modelValue', 3)

        await vi.waitFor(() => expect(lastPutBody).toEqual({quantity: 3}))
    })

    it('shows no price when the cart has no currency yet', async () => {
        cart = {...cartWithItems, currency_code: null as unknown as string}
        wrapper = await mountCart()

        expect(wrapper.text()).not.toContain('€')
    })

    it('hides the excl.-VAT row when the cart has not calculated it yet', async () => {
        cart = {...cartWithItems, item_subtotal: null as unknown as number}
        wrapper = await mountCart()

        expect(wrapper.text()).not.toContain('Prijs excl. btw')
    })

    it('applying a valid promo code adds it to the applied list and clears the input', async () => {
        applyShouldFail = false
        wrapper = await mountCart()

        await wrapper.find('input[placeholder="Promocode"]').setValue('WELCOME10')
        const applyButton = wrapper.findAllComponents({name: 'UButton'}).find((button) => button.text() === 'Toepassen')
        await applyButton!.trigger('click')

        await vi.waitFor(() => expect(lastPromotionBody).toEqual({code: 'WELCOME10'}))
        await vi.waitFor(() => expect(wrapper!.text()).toContain('WELCOME10'))
        expect((wrapper.find('input[placeholder="Promocode"]').element as HTMLInputElement).value).toBe('')
    })

    // The server tags a 400 with no Medusa-specific message as {data: {code: 'invalidPromoCode'}}
    // (see server/api/cart/promotions.post.ts), since its own English fallback statusMessage can't
    // be pre-translated; the client must show its own translated message for this code instead.
    it('applying an invalid promo code shows a translated error and keeps the input value', async () => {
        applyShouldFail = true
        applyFailureCode = 'invalidPromoCode'
        wrapper = await mountCart()

        await wrapper.find('input[placeholder="Promocode"]').setValue('BADCODE')
        const applyButton = wrapper.findAllComponents({name: 'UButton'}).find((button) => button.text() === 'Toepassen')
        await applyButton!.trigger('click')

        await vi.waitFor(() => expect(wrapper!.text()).toContain('Deze promocode is niet geldig.'))
        expect((wrapper.find('input[placeholder="Promocode"]').element as HTMLInputElement).value).toBe('BADCODE')
    })

    it('shows the server error message when applying a promo code fails for a reason other than an invalid code', async () => {
        applyShouldFail = true
        applyFailureStatusMessage = 'Could not apply promo code'
        wrapper = await mountCart()

        await wrapper.find('input[placeholder="Promocode"]').setValue('WELCOME10')
        const applyButton = wrapper.findAllComponents({name: 'UButton'}).find((button) => button.text() === 'Toepassen')
        await applyButton!.trigger('click')

        await vi.waitFor(() => expect(wrapper!.text()).toContain('Could not apply promo code'))
        expect(wrapper.text()).not.toContain('not valid')
    })

    it('removing an applied code calls the remove endpoint', async () => {
        cart = {...cartWithItems, promotions: [{id: 'promo_1', code: 'WELCOME10'}]}
        wrapper = await mountCart()
        await vi.waitFor(() => expect(wrapper!.text()).toContain('WELCOME10'))

        const removeButton = wrapper
            .findAllComponents({name: 'UButton'})
            .find((button) => button.props('icon') === 'i-lucide-x')
        await removeButton!.trigger('click')

        await vi.waitFor(() => expect(lastPromotionBody).toEqual({code: 'WELCOME10'}))
    })

    it('shows an error when removing an applied code fails', async () => {
        removeShouldFail = true
        cart = {...cartWithItems, promotions: [{id: 'promo_1', code: 'WELCOME10'}]}
        wrapper = await mountCart()
        await vi.waitFor(() => expect(wrapper!.text()).toContain('WELCOME10'))

        const removeButton = wrapper
            .findAllComponents({name: 'UButton'})
            .find((button) => button.props('icon') === 'i-lucide-x')
        await removeButton!.trigger('click')

        await vi.waitFor(() => expect(wrapper!.text()).toContain('kon niet worden verwijderd'))
        expect(wrapper.text()).toContain('WELCOME10')
    })

    it('forwards the /api/cart response onto the real browser response during SSR', async () => {
        wrapper = await mountCart()

        await vi.waitFor(() => expect(forwardSetCookieMock).toHaveBeenCalledWith(fakeRequestEvent, expect.anything()))
    })

    it('does not show a remove button for an automatically-applied promotion', async () => {
        cart = {...cartWithItems, promotions: [{id: 'promo_1', code: 'AUTO10', is_automatic: true}]}
        wrapper = await mountCart()
        await vi.waitFor(() => expect(wrapper!.text()).toContain('AUTO10'))

        const removeButton = wrapper
            .findAllComponents({name: 'UButton'})
            .find((button) => button.props('icon') === 'i-lucide-x')
        expect(removeButton).toBeUndefined()
    })
})
