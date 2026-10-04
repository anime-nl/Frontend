import type {StoreShippingOption} from '@medusajs/types'
import type {AddressRequest} from '#shared/utils/checkout'

/**
 * Actions for the checkout flow: setting the address, listing shipping options, selecting a
 * shipping method, and starting payment.
 * @returns The checkout action methods
 */
export function useCheckout() {
    /**
     * Validates and sets the cart's email and address.
     * @param address Address to set
     */
    async function submitAddress(address: AddressRequest): Promise<void> {
        await $fetch('/api/checkout/address', {method: 'POST', body: address})
    }

    /**
     * Lists the shipping options available for the cart's items.
     * @returns The available shipping options
     */
    async function fetchShippingOptions(): Promise<StoreShippingOption[]> {
        const {shipping_options} = await $fetch<{shipping_options: StoreShippingOption[]}>(
            '/api/checkout/shipping-options'
        )
        return shipping_options
    }

    /**
     * Sets the cart's shipping method.
     * @param optionId Shipping option id to select
     */
    async function selectShippingMethod(optionId: string): Promise<void> {
        await $fetch('/api/checkout/shipping-method', {method: 'POST', body: {option_id: optionId}})
    }

    /**
     * Creates a Mollie payment session for the cart.
     * @returns The URL to redirect the customer to for payment
     */
    async function startPayment(): Promise<string> {
        const {redirect_url} = await $fetch<{redirect_url: string}>('/api/checkout/payment-session', {method: 'POST'})
        return redirect_url
    }

    return {submitAddress, fetchShippingOptions, selectShippingMethod, startPayment}
}
