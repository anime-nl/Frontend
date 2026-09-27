<script setup lang="ts">
import type {StoreOrder} from '@medusajs/types'

type CompleteResponse = {status: 'completed'; order: StoreOrder} | {status: 'pending' | 'failed'; cart: unknown}

const status = ref<'completed' | 'pending' | 'failed'>('failed')
const order = ref<StoreOrder | null>(null)

try {
  const response = await $fetch<CompleteResponse>('/api/checkout/complete', {method: 'POST'})
  status.value = response.status
  if (response.status === 'completed') {
    order.value = response.order
  }
} catch {
  status.value = 'failed'
}

await useFetch('/api/account/me', {key: 'current-customer'})
const customer = useCustomer()
</script>

<template>
  <UContainer class="flex flex-col items-center gap-6 py-16 text-center">
    <template v-if="status === 'completed'">
      <UIcon name="i-lucide-circle-check" class="text-primary size-16" />
      <h1 class="text-3xl font-bold">Thank you for your order!</h1>
      <p class="text-slate-300">Order #{{ order?.display_id }} has been placed.</p>
      <UButton v-if="customer.customer.value" to="/account" label="View your orders" />
    </template>

    <template v-else-if="status === 'pending'">
      <UIcon name="i-lucide-clock" class="size-16" />
      <h1 class="text-3xl font-bold">Payment pending</h1>
      <p class="text-slate-300">We'll confirm your order once your payment clears.</p>
    </template>

    <template v-else>
      <UIcon name="i-lucide-circle-alert" class="text-error size-16" />
      <h1 class="text-3xl font-bold">Payment failed</h1>
      <p class="text-slate-300">Something went wrong with your payment. Please try again.</p>
      <UButton to="/cart" label="Back to cart" />
    </template>
  </UContainer>
</template>
