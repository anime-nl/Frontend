import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {mountSuspended, registerEndpoint} from '@nuxt/test-utils/runtime'
import {createError, readBody} from 'h3'
import CartPage from '~/pages/cart/index.vue'

const cartWithItems = {
    id: 'cart_1',
    currency_code: 'eur',
    subtotal: 18.0,
    tax_total: 3.8,
    discount_total: 0,
    item_total: 21.8,
    total: 21.8,
    promotions: [] as {id: string; code: string | null}[],
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

registerEndpoint('/api/cart', () => ({cart}))
registerEndpoint('/api/cart/promotions', {
    method: 'POST',
    handler: async (event) => {
        lastPromotionBody = await readBody(event)
        if (applyShouldFail) throw createError({statusCode: 400, statusMessage: 'That promo code is not valid.'})
        cart = {...cartWithItems, promotions: [{id: 'promo_1', code: (lastPromotionBody as {code: string}).code}]}
        return {cart}
    }
})
registerEndpoint('/api/cart/promotions', {
    method: 'DELETE',
    handler: async (event) => {
        lastPromotionBody = await readBody(event)
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

    it('shows the price excl. VAT, the VAT amount, the incl.-VAT subtotal and the total', async () => {
        wrapper = await mountCart()

        expect(wrapper.text()).toContain('Price excl. VAT')
        expect(wrapper.text()).toContain(eur(18.0))
        expect(wrapper.text()).toContain('VAT')
        expect(wrapper.text()).toContain(eur(3.8))
        expect(wrapper.text()).toContain('Subtotal')
        expect(wrapper.text()).toContain('Total')
        expect(wrapper.text()).toContain(eur(21.8))
    })

    it('does not show a discount row when there is no discount', async () => {
        wrapper = await mountCart()

        expect(wrapper.text()).not.toContain('Discount')
    })

    it('shows a discount row when a discount is applied', async () => {
        cart = {...cartWithItems, discount_total: 2.0}
        wrapper = await mountCart()

        expect(wrapper.text()).toContain('Discount')
        expect(wrapper.text()).toContain(eur(2.0))
    })

    it('does not show a variant line for an item with no variant title', async () => {
        cart = {...cartWithItems, items: [{...cartWithItems.items[0]!, variant_title: null as unknown as string}]}
        wrapper = await mountCart()

        expect(wrapper.text()).not.toContain('Default')
    })

    it('shows the empty-cart state when the cart has no items', async () => {
        cart = {...cartWithItems, items: []}
        wrapper = await mountCart()

        expect(wrapper.text().toLowerCase()).toContain('empty')
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
        cart = {...cartWithItems, subtotal: null as unknown as number}
        wrapper = await mountCart()

        expect(wrapper.text()).not.toContain('Price excl. VAT')
    })

    it('applying a valid promo code adds it to the applied list and clears the input', async () => {
        applyShouldFail = false
        wrapper = await mountCart()

        await wrapper.find('input[placeholder="Promo code"]').setValue('WELCOME10')
        const applyButton = wrapper.findAllComponents({name: 'UButton'}).find((button) => button.text() === 'Apply')
        await applyButton!.trigger('click')

        await vi.waitFor(() => expect(lastPromotionBody).toEqual({code: 'WELCOME10'}))
        await vi.waitFor(() => expect(wrapper!.text()).toContain('WELCOME10'))
        expect((wrapper.find('input[placeholder="Promo code"]').element as HTMLInputElement).value).toBe('')
    })

    it('applying an invalid promo code shows an error and keeps the input value', async () => {
        applyShouldFail = true
        wrapper = await mountCart()

        await wrapper.find('input[placeholder="Promo code"]').setValue('BADCODE')
        const applyButton = wrapper.findAllComponents({name: 'UButton'}).find((button) => button.text() === 'Apply')
        await applyButton!.trigger('click')

        await vi.waitFor(() => expect(wrapper!.text()).toContain('not valid'))
        expect((wrapper.find('input[placeholder="Promo code"]').element as HTMLInputElement).value).toBe('BADCODE')
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
})
