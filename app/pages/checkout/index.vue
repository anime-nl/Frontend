<script setup lang="ts">
import type {StoreShippingOption} from '@medusajs/types'
import {checkoutCountries, validateAddressRequest} from '#shared/utils/checkout'
import type {AddressRequest} from '#shared/utils/checkout'
import {formatCurrency} from '#shared/utils/currency'

await useFetch('/api/cart', {key: 'cart'})
const cart = useCart()

if (!cart.items.value.length) {
  await navigateTo('/cart')
}

await useFetch('/api/account/me', {key: 'current-customer'})
const customer = useCustomer()

type Step = 'address' | 'shipping' | 'review'
const step = ref<Step>('address')

const address = reactive<AddressRequest>({
  email: customer.customer.value?.email ?? '',
  firstName: customer.customer.value?.first_name ?? '',
  lastName: customer.customer.value?.last_name ?? '',
  street: '',
  houseNumber: '',
  postalCode: '',
  city: '',
  country: 'NL'
})

const shippingOptions = ref<StoreShippingOption[]>([])
const shippingOptionItems = computed(() =>
  shippingOptions.value.map((option) => ({
    value: option.id,
    label: `${option.name} — ${formatCurrency(option.amount, cart.cart.value?.currency_code ?? 'EUR')}`
  }))
)
const selectedOptionId = ref('')
const selectedShippingMethod = computed(() => cart.cart.value?.shipping_methods?.[0])

const submittingAddress = ref(false)
const addressError = ref('')

async function onAddressSubmit() {
  submittingAddress.value = true
  addressError.value = ''

  try {
    await $fetch('/api/checkout/address', {method: 'POST', body: address})
    await cart.refresh()

    const {shipping_options} = await $fetch<{shipping_options: StoreShippingOption[]}>('/api/checkout/shipping-options')
    shippingOptions.value = shipping_options
    selectedOptionId.value = shipping_options[0]?.id ?? ''

    step.value = 'shipping'
  } catch {
    addressError.value = 'Something went wrong saving your address. Please try again.'
  } finally {
    submittingAddress.value = false
  }
}

const submittingShipping = ref(false)
const shippingError = ref('')

async function onShippingContinue() {
  submittingShipping.value = true
  shippingError.value = ''

  try {
    await $fetch('/api/checkout/shipping-method', {method: 'POST', body: {option_id: selectedOptionId.value}})
    await cart.refresh()
    step.value = 'review'
  } catch {
    shippingError.value = 'Something went wrong setting your shipping method. Please try again.'
  } finally {
    submittingShipping.value = false
  }
}
</script>

<template>
  <UContainer class="flex flex-col gap-8 py-8">
    <h1 class="text-3xl font-bold">Checkout</h1>

    <UCard v-if="step === 'address'">
      <UForm :state="address" :validate="validateAddressRequest" class="flex flex-col gap-5" @submit="onAddressSubmit">
        <h2 class="text-xl font-semibold">1. Your address</h2>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <UFormField name="firstName" label="First name" required>
            <UInput v-model="address.firstName" autocomplete="given-name" class="w-full" />
          </UFormField>
          <UFormField name="lastName" label="Last name" required>
            <UInput v-model="address.lastName" autocomplete="family-name" class="w-full" />
          </UFormField>
        </div>

        <UFormField name="email" label="Email address" required>
          <UInput v-model="address.email" type="email" autocomplete="email" class="w-full" />
        </UFormField>

        <div class="grid grid-cols-1 sm:grid-cols-[2fr_1fr] gap-5">
          <UFormField name="street" label="Street" required>
            <UInput v-model="address.street" autocomplete="address-line1" class="w-full" />
          </UFormField>
          <UFormField name="houseNumber" label="House number" required>
            <UInput v-model="address.houseNumber" class="w-full" />
          </UFormField>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-[1fr_2fr_1fr] gap-5">
          <UFormField name="postalCode" label="Postal code" required>
            <UInput v-model="address.postalCode" autocomplete="postal-code" class="w-full" />
          </UFormField>
          <UFormField name="city" label="City" required>
            <UInput v-model="address.city" autocomplete="address-level2" class="w-full" />
          </UFormField>
          <UFormField name="country" label="Country" required>
            <USelect
              v-model="address.country"
              :items="checkoutCountries.map((country) => ({label: country.label, value: country.code as string}))"
              class="w-full"
            />
          </UFormField>
        </div>

        <UAlert
          v-if="addressError"
          color="error"
          variant="subtle"
          icon="i-lucide-circle-alert"
          :description="addressError"
        />

        <UButton type="submit" label="Continue to shipping" size="lg" class="self-end" :loading="submittingAddress" />
      </UForm>
    </UCard>

    <UCard v-else-if="step === 'shipping'">
      <div class="flex flex-col gap-5">
        <h2 class="text-xl font-semibold">2. Shipping method</h2>

        <URadioGroup v-model="selectedOptionId" :items="shippingOptionItems" />

        <UAlert
          v-if="shippingError"
          color="error"
          variant="subtle"
          icon="i-lucide-circle-alert"
          :description="shippingError"
        />

        <div class="flex justify-between">
          <UButton label="Back" color="neutral" variant="ghost" @click="step = 'address'" />
          <UButton
            label="Continue to review"
            size="lg"
            :disabled="!selectedOptionId"
            :loading="submittingShipping"
            @click="onShippingContinue"
          />
        </div>
      </div>
    </UCard>

    <UCard v-else>
      <div class="flex flex-col gap-6">
        <h2 class="text-xl font-semibold">Review your order</h2>

        <div class="flex flex-col gap-2">
          <p class="font-semibold">Shipping to</p>
          <p class="text-slate-300">
            {{ address.firstName }} {{ address.lastName }}<br />
            {{ address.street }} {{ address.houseNumber }}<br />
            {{ address.postalCode }} {{ address.city }}
          </p>
        </div>

        <div v-if="selectedShippingMethod" class="flex justify-between">
          <span>{{ selectedShippingMethod.name }}</span>
          <span>{{ cart.format(selectedShippingMethod.amount) }}</span>
        </div>

        <div class="flex flex-col gap-2">
          <div v-for="item in cart.items.value" :key="item.id" class="flex justify-between">
            <span>{{ item.title }} × {{ item.quantity }}</span>
            <span>{{ cart.format(item.unit_price * item.quantity) }}</span>
          </div>
        </div>

        <div class="flex justify-between text-xl font-bold">
          <span>Total</span>
          <span>{{ cart.total.value }}</span>
        </div>

        <UButton label="Back" color="neutral" variant="ghost" class="self-start" @click="step = 'shipping'" />
      </div>
    </UCard>
  </UContainer>
</template>
