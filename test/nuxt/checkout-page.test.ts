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
    subtotal: 18.0,
    tax_total: 3.8,
    item_subtotal: 18.0,
    original_item_tax_total: 3.8,
    discount_total: 0,
    item_total: 21.8,
    total: 21.8,
    promotions: [] as {id: string; code: string | null}[],
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
let lastPromotionBody: unknown
let applyShouldFail = false

registerEndpoint('/api/cart', () => ({cart}))
registerEndpoint('/api/cart/promotions', {
    method: 'POST',
    handler: async (event) => {
        lastPromotionBody = await readBody(event)
        if (applyShouldFail) throw createError({statusCode: 400, statusMessage: 'That promo code is not valid.'})
        cart = {
            ...(cart as typeof cartWithItems),
            promotions: [{id: 'promo_1', code: (lastPromotionBody as {code: string}).code}]
        }
        return {cart}
    }
})
registerEndpoint('/api/cart/promotions', {
    method: 'DELETE',
    handler: async (event) => {
        lastPromotionBody = await readBody(event)
        cart = {...(cart as typeof cartWithItems), promotions: []}
        return {cart}
    }
})
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
        cart = {...cartWithItems, promotions: (cart as typeof cartWithItems).promotions}
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
        cart = {
            ...cartWithItems,
            promotions: (cart as typeof cartWithItems).promotions,
            shipping_methods: [{id: 'sm_1', name: option.name, amount: option.amount}],
            total: cartWithItems.item_total + option.amount
        }
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
    lastPromotionBody = undefined
    applyShouldFail = false
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

    it('splitting a combined autofilled street value fills the house-number field', async () => {
        wrapper = await mountCheckout()

        await wrapper.find('[name="street"]').setValue('Kerkstraat 12A')

        expect((wrapper.find('[name="street"]').element as HTMLInputElement).value).toBe('Kerkstraat')
        expect((wrapper.find('[name="houseNumber"]').element as HTMLInputElement).value).toBe('12A')
    })

    it('does not split a house number while the customer is still typing, only once they move on from the field', async () => {
        wrapper = await mountCheckout()
        const street = wrapper.find('[name="street"]')

        for (const partial of ['K', 'Ke', 'Kerkstraat', 'Kerkstraat 1', 'Kerkstraat 12A']) {
            ;(street.element as HTMLInputElement).value = partial
            await street.trigger('input')
        }

        expect((street.element as HTMLInputElement).value).toBe('Kerkstraat 12A')
        expect((wrapper.find('[name="houseNumber"]').element as HTMLInputElement).value).toBe('')

        await street.trigger('change')

        expect((street.element as HTMLInputElement).value).toBe('Kerkstraat')
        expect((wrapper.find('[name="houseNumber"]').element as HTMLInputElement).value).toBe('12A')
    })

    it('does not override a house number the customer already typed', async () => {
        wrapper = await mountCheckout()

        await wrapper.find('[name="houseNumber"]').setValue('5')
        await wrapper.find('[name="street"]').setValue('Kerkstraat 12A')

        expect((wrapper.find('[name="houseNumber"]').element as HTMLInputElement).value).toBe('5')
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

    it('the review step shows the VAT breakdown, and the subtotal excludes shipping while the total includes it', async () => {
        wrapper = await mountCheckout()
        await reachReviewStep(wrapper)

        expect(wrapper.text()).toContain('Price excl. VAT')
        expect(wrapper.text()).toContain(eur(18.0))
        expect(wrapper.text()).toContain('VAT')
        expect(wrapper.text()).toContain(eur(3.8))
        // Subtotal is items-only (no shipping yet); Total adds the chosen Standard shipping (4.95).
        expect(wrapper.text()).toContain('Subtotal')
        expect(wrapper.text()).toContain(eur(21.8))
        expect(wrapper.text()).toContain('Total')
        expect(wrapper.text()).toContain(eur(26.75))
    })

    it('the review step lists already-applied promo codes with a remove option', async () => {
        cart = {...cartWithItems, promotions: [{id: 'promo_1', code: 'WELCOME10'}]}
        wrapper = await mountCheckout()
        await reachReviewStep(wrapper)

        expect(wrapper.text()).toContain('WELCOME10')
        expect(
            wrapper.findAllComponents({name: 'UButton'}).some((button) => button.props('icon') === 'i-lucide-x')
        ).toBe(true)
    })

    it('applying a promo code on the review step adds it to the cart', async () => {
        wrapper = await mountCheckout()
        await reachReviewStep(wrapper)

        await wrapper.find('input[placeholder="Promo code"]').setValue('WELCOME10')
        const applyButton = wrapper.findAllComponents({name: 'UButton'}).find((button) => button.text() === 'Apply')
        await applyButton!.trigger('click')

        await vi.waitFor(() => expect(lastPromotionBody).toEqual({code: 'WELCOME10'}))
        await vi.waitFor(() => expect(wrapper!.text()).toContain('WELCOME10'))
    })
})
