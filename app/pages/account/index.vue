<script setup lang="ts">
import type {StoreOrder} from '@medusajs/types'
import {formatCurrency} from '#shared/utils/currency'

// useFetch dedupes by key, so this call (not useCustomer's own) is the one that actually fires
// and must carry the cookie-forwarding hook.
const requestEvent = useRequestEvent()
await useFetch('/api/account/me', {
  key: 'current-customer',
  onResponse: ({response}) => forwardSetCookie(requestEvent, response)
})
const customer = useCustomer()
const {t, localeProperties} = useI18n()

const {data: ordersData} = await useFetch<{orders: StoreOrder[]}>('/api/account/orders', {
  key: 'account-orders',
  immediate: !!customer.customer.value
})
const orders = computed(() => ordersData.value?.orders ?? [])

async function logout() {
  await $fetch('/api/account/logout', {method: 'POST'})
  await customer.refresh()
}
</script>

<template>
  <UContainer v-if="!customer.customer.value" class="flex flex-col items-center gap-4 py-16 text-center">
    <p>{{ t('account.signInPrompt') }}</p>
    <UButton to="/account/login">{{ t('account.signInTitle') }}</UButton>
  </UContainer>

  <UContainer v-else class="flex flex-col gap-8 py-8">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold">{{ t('account.accountHeading') }}</h1>
        <p class="text-slate-400">{{ customer.customer.value.email }}</p>
      </div>
      <UButton color="neutral" variant="outline" @click="logout">{{ t('account.logOut') }}</UButton>
    </div>

    <div class="flex flex-col gap-4">
      <h2 class="text-2xl font-bold">{{ t('account.orderHistory') }}</h2>
      <p v-if="!orders.length" class="text-slate-400">{{ t('account.noOrders') }}</p>
      <div v-else class="flex flex-col gap-2">
        <div
          v-for="order in orders"
          :key="order.id"
          class="flex items-center justify-between border-b border-sky-200/20 pb-2"
        >
          <span>{{ t('account.orderNumber', {number: order.display_id ?? order.id}) }}</span>
          <UBadge :label="order.status" color="neutral" variant="subtle" />
          <span class="font-semibold">{{
            formatCurrency(order.total, order.currency_code, localeProperties.language!)
          }}</span>
        </div>
      </div>
    </div>
  </UContainer>
</template>
