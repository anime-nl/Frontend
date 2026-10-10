<script setup lang="ts">
import type {StoreOrder} from '@medusajs/types'
import {formatCurrency} from '#shared/utils/currency'

const route = useRoute()
const {t, localeProperties} = useI18n()

const requestEvent = useRequestEvent()
const {data, error} = await useFetch<{order: StoreOrder}>(`/api/orders/${route.params.id}`, {
  query: {token: route.query.token},
  // The order only exists for the customer who owns it; a shared cache key would leak it between visitors.
  key: `order-${route.params.id}-${route.query.token ?? ''}`,
  onResponse: ({response}) => forwardSetCookie(requestEvent, response)
})

const order = computed(() => data.value?.order)
const language = computed(() => localeProperties.value.language!)

/**
 * Formats an amount of the order in the order's own currency.
 * @param amount Amount in the order's currency
 * @returns The formatted price, e.g. "€ 12,50"
 */
function price(amount: number) {
  return formatCurrency(amount, order.value!.currency_code, language.value)
}
</script>

<template>
  <UContainer class="flex flex-col gap-8 py-12">
    <div v-if="!order" class="flex flex-col items-center gap-4 py-16 text-center">
      <UIcon name="i-lucide-info" class="size-16" />
      <h1 class="text-3xl font-bold">{{ t('order.notFoundTitle') }}</h1>
      <p class="text-slate-300">{{ error ? t('order.notFoundBody') : '' }}</p>
      <UButton to="/" :label="t('cart.continueShopping')" />
    </div>

    <template v-else>
      <div class="flex flex-col gap-1">
        <h1 class="text-3xl font-bold">{{ t('order.title', {number: order.display_id}) }}</h1>
        <p class="text-slate-400">
          {{ t('order.placedOn', {date: new Date(order.created_at).toLocaleDateString(language)}) }}
        </p>
      </div>

      <section class="flex flex-col gap-4">
        <h2 class="text-xl font-bold">{{ t('order.timelineHeading') }}</h2>
        <OrderTimeline :payment-status="order.payment_status" :fulfillment-status="order.fulfillment_status" />
      </section>

      <section class="flex flex-col gap-4">
        <h2 class="text-xl font-bold">{{ t('order.itemsHeading') }}</h2>
        <ul class="flex flex-col gap-2">
          <li
            v-for="item in order.items"
            :key="item.id"
            class="flex items-center justify-between gap-4 border-b border-sky-200/20 pb-2"
          >
            <span>{{ t('order.quantity', {count: item.quantity}) }} {{ item.product_title ?? item.title }}</span>
            <span class="font-semibold">{{ price(item.total) }}</span>
          </li>
        </ul>
        <dl class="flex flex-col gap-1">
          <div class="flex justify-between">
            <dt>{{ t('order.subtotal') }}</dt>
            <dd>{{ price(order.item_subtotal) }}</dd>
          </div>
          <div class="flex justify-between">
            <dt>{{ t('order.shipping') }}</dt>
            <dd>{{ price(order.shipping_total) }}</dd>
          </div>
          <div class="flex justify-between text-lg font-bold">
            <dt>{{ t('order.total') }}</dt>
            <dd>{{ price(order.total) }}</dd>
          </div>
        </dl>
      </section>

      <section v-if="order.shipping_address" class="flex flex-col gap-2">
        <h2 class="text-xl font-bold">{{ t('order.shippingAddress') }}</h2>
        <address class="text-slate-300 not-italic">
          {{ order.shipping_address.first_name }} {{ order.shipping_address.last_name }}<br />
          {{ order.shipping_address.address_1 }}<br />
          {{ order.shipping_address.postal_code }} {{ order.shipping_address.city }}
        </address>
      </section>
    </template>
  </UContainer>
</template>
