import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {mountSuspended, registerEndpoint} from '@nuxt/test-utils/runtime'
import {readBody} from 'h3'
import CartPage from '~/pages/cart/index.vue'

const cartWithItems = {
    id: 'cart_1',
    currency_code: 'eur',
    subtotal: 21.8,
    total: 21.8,
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

registerEndpoint('/api/cart', () => ({cart}))
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

    it('shows the subtotal formatted as EUR currency', async () => {
        wrapper = await mountCart()

        expect(wrapper.text()).toContain(eur(21.8))
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

    it('shows no subtotal when the cart has not calculated one yet', async () => {
        cart = {...cartWithItems, subtotal: null as unknown as number}
        wrapper = await mountCart()

        const subtotalRow = wrapper.text().split('Subtotal')[1]
        expect(subtotalRow?.trim().startsWith('€')).toBe(false)
    })
})
