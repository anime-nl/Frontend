<script setup lang="ts">
import type {StoreShippingOption} from '@medusajs/types'
import {checkoutCountries, splitStreetAndHouseNumber, validateAddressRequest} from '#shared/utils/checkout'
import type {AddressRequest} from '#shared/utils/checkout'
import {formatCurrency} from '#shared/utils/currency'

const {t, localeProperties} = useI18n()
const localePath = useLocalePath()

// Blocking so the redirect guard below and the address prefill see real data on first render, not
// the transient empty state before useCart's/useCustomer's own fetch resolves. No onResponse here:
// Navbar renders before this page and already calls useCart()/useCustomer(), whose own useFetch
// carries the cookie-forwarding hook - this page's call is the dedup'd second one, not the one
// Nuxt actually sends over the wire.
await useFetch('/api/cart', {key: 'cart'})
const cart = useCart()

if (!cart.items.value.length) {
  await navigateTo(localePath('/cart'))
}

await useFetch('/api/account/me', {key: 'current-customer'})
const customer = useCustomer()
const checkout = useCheckout()

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

/**
 * Adapts validateAddressRequest's codes to UForm's expected {name, message} shape.
 * @param input Current form state
 * @returns Translated field errors for UForm to display
 */
function validateAddress(input: AddressRequest) {
  return validateAddressRequest(input).map((error) => ({
    name: error.name,
    message: t(`validation.${error.code}`, error.params ?? {})
  }))
}

const countryItems = computed(() =>
  checkoutCountries.map((country) => ({label: t(`common.countries.${country.code}`), value: country.code as string}))
)

/**
 * Dutch browser autofill profiles store the full "Street 12A"-style address as one value and drop
 * it into whichever field is recognized as the street line. Splits it out on the field's native
 * `change` event (blur, or autofill), not on every keystroke - splitting on every input would
 * trample a house number the customer is still in the middle of typing into the street field
 * themselves. Only runs when houseNumber is still empty, so it never overwrites a number the
 * customer already entered.
 */
function onStreetChange() {
  if (address.houseNumber) return
  const split = splitStreetAndHouseNumber(address.street)
  if (split.houseNumber) {
    address.street = split.street
    address.houseNumber = split.houseNumber
  }
}

const shippingOptions = ref<StoreShippingOption[]>([])
const shippingOptionItems = computed(() =>
  shippingOptions.value.map((option) => ({
    value: option.id,
    label: `${option.name} — ${formatCurrency(option.amount, cart.cart.value?.currency_code ?? 'EUR', localeProperties.value.language!)}`
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
    await checkout.submitAddress(address)
    await cart.refresh()

    shippingOptions.value = await checkout.fetchShippingOptions()
    selectedOptionId.value = shippingOptions.value[0]?.id ?? ''

    step.value = 'shipping'
  } catch {
    addressError.value = t('checkout.addressError')
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
    await checkout.selectShippingMethod(selectedOptionId.value)
    await cart.refresh()
    step.value = 'review'
  } catch {
    shippingError.value = t('checkout.shippingError')
  } finally {
    submittingShipping.value = false
  }
}

const submittingPayment = ref(false)
const paymentError = ref('')

async function onPay() {
  submittingPayment.value = true
  paymentError.value = ''

  try {
    const redirectUrl = await checkout.startPayment()
    await navigateTo(redirectUrl, {external: true})
  } catch {
    paymentError.value = t('checkout.paymentError')
    submittingPayment.value = false
  }
}
</script>

<template>
  <UContainer class="flex flex-col gap-8 py-8">
    <h1 class="text-3xl font-bold">{{ t('checkout.title') }}</h1>

    <UCard v-if="step === 'address'">
      <UForm :state="address" :validate="validateAddress" class="flex flex-col gap-5" @submit="onAddressSubmit">
        <h2 class="text-xl font-semibold">{{ t('checkout.steps.address.heading') }}</h2>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <UFormField name="firstName" :label="t('checkout.form.firstName')" required>
            <UInput v-model="address.firstName" autocomplete="given-name" class="w-full" />
          </UFormField>
          <UFormField name="lastName" :label="t('checkout.form.lastName')" required>
            <UInput v-model="address.lastName" autocomplete="family-name" class="w-full" />
          </UFormField>
        </div>

        <UFormField name="email" :label="t('checkout.form.email')" required>
          <UInput v-model="address.email" type="email" autocomplete="email" class="w-full" />
        </UFormField>

        <div class="grid grid-cols-1 sm:grid-cols-[2fr_1fr] gap-5">
          <UFormField name="street" :label="t('checkout.form.street')" required>
            <UInput v-model="address.street" autocomplete="address-line1" class="w-full" @change="onStreetChange" />
          </UFormField>
          <UFormField name="houseNumber" :label="t('checkout.form.houseNumber')" required>
            <UInput v-model="address.houseNumber" autocomplete="address-line2" class="w-full" />
          </UFormField>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-[1fr_2fr_1fr] gap-5">
          <UFormField name="postalCode" :label="t('checkout.form.postalCode')" required>
            <UInput v-model="address.postalCode" autocomplete="postal-code" class="w-full" />
          </UFormField>
          <UFormField name="city" :label="t('checkout.form.city')" required>
            <UInput v-model="address.city" autocomplete="address-level2" class="w-full" />
          </UFormField>
          <UFormField name="country" :label="t('checkout.form.country')" required>
            <USelect v-model="address.country" :items="countryItems" class="w-full" />
          </UFormField>
        </div>

        <UAlert
          v-if="addressError"
          color="error"
          variant="subtle"
          icon="i-lucide-circle-alert"
          :description="addressError"
        />

        <UButton
          type="submit"
          :label="t('checkout.continueToShipping')"
          size="lg"
          class="self-end"
          :loading="submittingAddress"
        />
      </UForm>
    </UCard>

    <UCard v-else-if="step === 'shipping'">
      <div class="flex flex-col gap-5">
        <h2 class="text-xl font-semibold">{{ t('checkout.steps.shipping.heading') }}</h2>

        <URadioGroup v-model="selectedOptionId" :items="shippingOptionItems" />

        <UAlert
          v-if="shippingError"
          color="error"
          variant="subtle"
          icon="i-lucide-circle-alert"
          :description="shippingError"
        />

        <div class="flex justify-between">
          <UButton :label="t('checkout.back')" color="neutral" variant="ghost" @click="step = 'address'" />
          <UButton
            :label="t('checkout.continueToReview')"
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
        <h2 class="text-xl font-semibold">{{ t('checkout.steps.review.heading') }}</h2>

        <div class="flex flex-col gap-2">
          <p class="font-semibold">{{ t('checkout.shippingTo') }}</p>
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

        <CartSummary />

        <UAlert
          v-if="paymentError"
          color="error"
          variant="subtle"
          icon="i-lucide-circle-alert"
          :description="paymentError"
        />

        <div class="flex justify-between">
          <UButton :label="t('checkout.back')" color="neutral" variant="ghost" @click="step = 'shipping'" />
          <UButton :label="t('checkout.pay')" size="lg" :loading="submittingPayment" @click="onPay" />
        </div>
      </div>
    </UCard>
  </UContainer>
</template>
