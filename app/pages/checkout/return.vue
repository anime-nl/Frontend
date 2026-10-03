<script setup lang="ts">
import type {StoreOrder} from '@medusajs/types'

type CompleteResponse = {status: 'completed'; order: StoreOrder} | {status: 'pending' | 'failed'; cart: unknown}

const {t} = useI18n()

// useFetch (not a plain $fetch) is required here: only useFetch forwards the browser's cookies to
// this internal API call during server-side rendering, which /api/checkout/complete needs to read
// the cart_id cookie. A plain $fetch would always see no cookie on the first, server-rendered paint.
const requestEvent = useRequestEvent()
const {data, error} = await useFetch<CompleteResponse>('/api/checkout/complete', {
  method: 'POST',
  onResponse: ({response}) => forwardSetCookie(requestEvent, response)
})

// The complete route (and the Mollie provider behind it) cannot always tell "still processing" apart
// from "genuinely failed" — see docs/known-issues.md. Only a confident 'failed' response from the API
// is shown as failed; every other error defaults to 'pending' rather than risk telling a customer
// their successful payment failed. A 400 means there was no cart_id cookie at all (a stale bookmark,
// or a reload after the cart was already cleared on a completed order) - nothing to report either way.
const status = computed<'completed' | 'pending' | 'failed' | 'idle'>(() => {
  if (data.value) return data.value.status
  if (error.value?.statusCode === 400) return 'idle'
  return 'pending'
})
const order = computed(() => (data.value?.status === 'completed' ? data.value.order : null))

const cart = useCart()
if (status.value === 'completed') {
  await cart.refresh()
}

await useFetch('/api/account/me', {
  key: 'current-customer',
  onResponse: ({response}) => forwardSetCookie(requestEvent, response)
})
const customer = useCustomer()
</script>

<template>
  <UContainer class="flex flex-col items-center gap-6 py-16 text-center">
    <template v-if="status === 'completed'">
      <UIcon name="i-lucide-circle-check" class="text-primary size-16" />
      <h1 class="text-3xl font-bold">{{ t('checkout.return.completedTitle') }}</h1>
      <p class="text-slate-300">{{ t('checkout.return.orderPlaced', {number: order?.display_id}) }}</p>
      <UButton v-if="customer.customer.value" to="/account" :label="t('checkout.return.viewOrders')" />
    </template>

    <template v-else-if="status === 'pending'">
      <UIcon name="i-lucide-clock" class="size-16" />
      <h1 class="text-3xl font-bold">{{ t('checkout.return.pendingTitle') }}</h1>
      <p class="text-slate-300">{{ t('checkout.return.pendingBody') }}</p>
    </template>

    <template v-else-if="status === 'failed'">
      <UIcon name="i-lucide-circle-alert" class="text-error size-16" />
      <h1 class="text-3xl font-bold">{{ t('checkout.return.failedTitle') }}</h1>
      <p class="text-slate-300">{{ t('checkout.return.failedBody') }}</p>
      <UButton to="/cart" :label="t('checkout.return.backToCart')" />
    </template>

    <template v-else>
      <UIcon name="i-lucide-info" class="size-16" />
      <h1 class="text-3xl font-bold">{{ t('checkout.return.idleTitle') }}</h1>
      <p class="text-slate-300">{{ t('checkout.return.idleBody') }}</p>
      <UButton to="/" :label="t('cart.continueShopping')" />
    </template>
  </UContainer>
</template>
