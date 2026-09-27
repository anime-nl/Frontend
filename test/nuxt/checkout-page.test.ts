import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {flushPromises} from '@vue/test-utils'
import {mockNuxtImport, mountSuspended, registerEndpoint} from '@nuxt/test-utils/runtime'
import {createError, readBody} from 'h3'
import CheckoutPage from '~/pages/checkout/index.vue'

const navigateToMock = vi.hoisted(() => vi.fn())
mockNuxtImport('navigateTo', () => navigateToMock)

const cartWithItems = {
    id: 'cart_1',
    currency_code: 'eur',
    subtotal: 21.8,
    total: 21.8,
    items: [{id: 'item_1', title: 'Acrylic Zhongli Keychain', quantity: 2, unit_price: 10.9}],
    shipping_methods: [] as {id: string; name: string; amount: number}[]
}

const shippingOptions = [
    {id: 'so_standard', name: 'Standard', amount: 4.95},
    {id: 'so_express', name: 'Express', amount: 9.95}
]

let cart: typeof cartWithItems | {items: []}
let customer: {email: string; first_name: string; last_name: string} | null
let lastAddressBody: unknown

registerEndpoint('/api/cart', () => ({cart}))
registerEndpoint('/api/account/me', () => {
    if (!customer) throw createError({statusCode: 401})
    return {customer}
})
registerEndpoint('/api/checkout/address', {
    method: 'POST',
    handler: async (event) => {
        lastAddressBody = await readBody(event)
        cart = {...cartWithItems}
        return {cart}
    }
})
registerEndpoint('/api/checkout/shipping-options', () => ({shipping_options: shippingOptions}))
registerEndpoint('/api/checkout/shipping-method', {
    method: 'POST',
    handler: async (event) => {
        const {option_id} = await readBody<{option_id: string}>(event)
        const option = shippingOptions.find((o) => o.id === option_id)!
        cart = {...cartWithItems, shipping_methods: [{id: 'sm_1', name: option.name, amount: option.amount}]}
        return {cart}
    }
})

const eur = (amount: number) => new Intl.NumberFormat('nl-NL', {style: 'currency', currency: 'EUR'}).format(amount)
const mountCheckout = () => mountSuspended(CheckoutPage)

const validAddress = {
    email: 'jan@example.nl',
    firstName: 'Jan',
    lastName: 'Jansen',
    street: 'Kerkstraat',
    houseNumber: '12',
    postalCode: '1234 AB',
    city: 'Amsterdam'
}

async function fillAddress(wrapper: Awaited<ReturnType<typeof mountCheckout>>) {
    for (const [field, value] of Object.entries(validAddress)) {
        await wrapper.find(`[name="${field}"]`).setValue(value)
    }
}

const submitAddress = async (wrapper: Awaited<ReturnType<typeof mountCheckout>>) => {
    await wrapper.find('form').trigger('submit')
    await vi.waitFor(() => expect(lastAddressBody).not.toBeUndefined())
}

let wrapper: Awaited<ReturnType<typeof mountCheckout>> | undefined

beforeEach(() => {
    cart = cartWithItems
    customer = null
    lastAddressBody = undefined
    navigateToMock.mockClear()
})

afterEach(() => {
    wrapper?.unmount()
})

describe('checkout page', () => {
    it('redirects to /cart when the cart has no items', async () => {
        cart = {items: []}
        wrapper = await mountCheckout()

        expect(navigateToMock).toHaveBeenCalledWith('/cart')
    })

    it('pre-fills the address form for a signed-in customer', async () => {
        customer = {email: 'mies@example.nl', first_name: 'Mies', last_name: 'Bakker'}
        wrapper = await mountCheckout()

        expect((wrapper.find('[name="email"]').element as HTMLInputElement).value).toBe('mies@example.nl')
        expect((wrapper.find('[name="firstName"]').element as HTMLInputElement).value).toBe('Mies')
        expect((wrapper.find('[name="lastName"]').element as HTMLInputElement).value).toBe('Bakker')
    })

    it('submitting the address loads shipping options with formatted prices', async () => {
        wrapper = await mountCheckout()

        await fillAddress(wrapper)
        await submitAddress(wrapper)

        expect(lastAddressBody).toMatchObject({email: 'jan@example.nl', firstName: 'Jan', country: 'NL'})
        await vi.waitFor(() => expect(wrapper!.text()).toContain('Standard'))
        expect(wrapper.text()).toContain(eur(4.95))
        expect(wrapper.text()).toContain('Express')
        expect(wrapper.text()).toContain(eur(9.95))
    })

    it('choosing a shipping method and continuing shows the order review', async () => {
        wrapper = await mountCheckout()
        await fillAddress(wrapper)
        await submitAddress(wrapper)
        await vi.waitFor(() => expect(wrapper!.findComponent({name: 'URadioGroup'}).exists()).toBe(true))

        const radioGroup = wrapper.findComponent({name: 'URadioGroup'})
        await radioGroup.vm.$emit('update:modelValue', 'so_express')
        await flushPromises()

        const continueButton = wrapper
            .findAllComponents({name: 'UButton'})
            .find((button) => button.text() === 'Continue to review')
        await continueButton!.trigger('click')
        await vi.waitFor(() => expect(wrapper!.text()).toContain('Review your order'))

        expect(wrapper.text()).toContain('Acrylic Zhongli Keychain')
        expect(wrapper.text()).toContain('Express')
        expect(wrapper.text()).not.toContain('Pay')
    })
})
