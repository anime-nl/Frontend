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
let addressShouldFail = false
let shippingMethodShouldFail = false

registerEndpoint('/api/checkout/address', {
    method: 'POST',
    handler: async (event) => {
        lastAddressBody = await readBody(event)
        if (addressShouldFail) throw createError({statusCode: 500})
        cart = {...cartWithItems}
        return {cart}
    }
})
registerEndpoint('/api/checkout/shipping-options', () => ({shipping_options: shippingOptions}))
registerEndpoint('/api/checkout/shipping-method', {
    method: 'POST',
    handler: async (event) => {
        const {option_id} = await readBody<{option_id: string}>(event)
        if (shippingMethodShouldFail) throw createError({statusCode: 500})
        const option = shippingOptions.find((o) => o.id === option_id)!
        cart = {...cartWithItems, shipping_methods: [{id: 'sm_1', name: option.name, amount: option.amount}]}
        return {cart}
    }
})
let paymentSessionError: {statusCode: number; statusMessage: string} | undefined
registerEndpoint('/api/checkout/payment-session', {
    method: 'POST',
    handler: () => {
        if (paymentSessionError) throw createError(paymentSessionError)
        return {redirect_url: 'https://mollie.example/checkout/abc'}
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
    addressShouldFail = false
    shippingMethodShouldFail = false
    paymentSessionError = undefined
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
    })

    it('shows an error and stays on the address step when saving the address fails', async () => {
        addressShouldFail = true
        wrapper = await mountCheckout()

        await fillAddress(wrapper)
        await submitAddress(wrapper)

        await vi.waitFor(() =>
            expect(wrapper!.text()).toContain('Something went wrong saving your address. Please try again.')
        )
        expect(wrapper.text()).not.toContain('Standard')
    })

    it('going back from the shipping step returns to the address step', async () => {
        wrapper = await mountCheckout()
        await fillAddress(wrapper)
        await submitAddress(wrapper)
        await vi.waitFor(() => expect(wrapper!.findComponent({name: 'URadioGroup'}).exists()).toBe(true))

        const backButton = wrapper.findAllComponents({name: 'UButton'}).find((button) => button.text() === 'Back')
        await backButton!.trigger('click')

        expect(wrapper.find('[name="email"]').exists()).toBe(true)
    })

    it('shows an error and stays on the shipping step when setting the shipping method fails', async () => {
        shippingMethodShouldFail = true
        wrapper = await mountCheckout()
        await fillAddress(wrapper)
        await submitAddress(wrapper)
        await vi.waitFor(() => expect(wrapper!.findComponent({name: 'URadioGroup'}).exists()).toBe(true))

        await wrapper.findComponent({name: 'URadioGroup'}).vm.$emit('update:modelValue', 'so_standard')
        await flushPromises()
        const continueButton = wrapper
            .findAllComponents({name: 'UButton'})
            .find((button) => button.text() === 'Continue to review')
        await continueButton!.trigger('click')

        await vi.waitFor(() =>
            expect(wrapper!.text()).toContain('Something went wrong setting your shipping method. Please try again.')
        )
        expect(wrapper.text()).not.toContain('Review your order')
    })

    async function reachReviewStep(w: Awaited<ReturnType<typeof mountCheckout>>) {
        await fillAddress(w)
        await submitAddress(w)
        await vi.waitFor(() => expect(w.findComponent({name: 'URadioGroup'}).exists()).toBe(true))
        await w.findComponent({name: 'URadioGroup'}).vm.$emit('update:modelValue', 'so_standard')
        await flushPromises()
        const continueButton = w
            .findAllComponents({name: 'UButton'})
            .find((button) => button.text() === 'Continue to review')
        await continueButton!.trigger('click')
        await vi.waitFor(() => expect(w.text()).toContain('Review your order'))
    }

    function findPayButton(w: Awaited<ReturnType<typeof mountCheckout>>) {
        return w.findAllComponents({name: 'UButton'}).find((button) => button.text() === 'Pay')
    }

    it('paying redirects the browser to the Mollie checkout URL', async () => {
        wrapper = await mountCheckout()
        await reachReviewStep(wrapper)

        await findPayButton(wrapper)!.trigger('click')

        await vi.waitFor(() =>
            expect(navigateToMock).toHaveBeenCalledWith('https://mollie.example/checkout/abc', {external: true})
        )
    })

    it('shows an error when starting the payment fails', async () => {
        paymentSessionError = {statusCode: 502, statusMessage: 'Could not start payment'}
        wrapper = await mountCheckout()
        await reachReviewStep(wrapper)

        await findPayButton(wrapper)!.trigger('click')

        await vi.waitFor(() => expect(wrapper!.text()).toContain('Something went wrong starting your payment'))
        expect(navigateToMock).not.toHaveBeenCalledWith(expect.stringContaining('mollie'), expect.anything())
    })

    it('going back from the review step returns to the shipping step', async () => {
        wrapper = await mountCheckout()
        await reachReviewStep(wrapper)

        const backButton = wrapper.findAllComponents({name: 'UButton'}).find((button) => button.text() === 'Back')
        await backButton!.trigger('click')

        expect(wrapper.findComponent({name: 'URadioGroup'}).exists()).toBe(true)
    })
})
