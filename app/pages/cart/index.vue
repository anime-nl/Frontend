<script setup lang="ts">
const {t} = useI18n()
// Two things depend on this call, not just useCart's own: (1) a Suspense boundary - this page's
// own mountSuspended test, and a client-side navigation - only waits for an awaited expression in
// THIS component's setup, not for a composable's internal fetch on its own; (2) useFetch dedupes
// by key, and whichever call for a given key is registered first is the one whose options
// (including onResponse) actually apply - when nothing upstream (e.g. Navbar) has already
// requested 'cart', this is that first call, so it must carry the cookie-forwarding hook itself.
const requestEvent = useRequestEvent()
await useFetch('/api/cart', {key: 'cart', onResponse: ({response}) => forwardSetCookie(requestEvent, response)})
const cart = useCart()

const updating = ref<string | null>(null)

async function onQuantityChange(itemId: string, quantity: number) {
  updating.value = itemId
  try {
    await cart.updateItem(itemId, quantity)
  } finally {
    updating.value = null
  }
}

async function onRemove(itemId: string) {
  updating.value = itemId
  try {
    await cart.removeItem(itemId)
  } finally {
    updating.value = null
  }
}
</script>

<template>
  <UContainer class="flex flex-col gap-8 py-8">
    <h1 class="text-3xl font-bold">{{ t('cart.title') }}</h1>

    <div v-if="cart.items.value.length" class="flex flex-col gap-6">
      <div
        v-for="item in cart.items.value"
        :key="item.id"
        class="flex flex-col sm:flex-row sm:items-center gap-4 border-b border-sky-200/20 pb-4"
      >
        <img v-if="item.thumbnail" :src="item.thumbnail" :alt="item.title" class="h-20 w-20 rounded-lg object-cover" />
        <div class="flex-1 min-w-0">
          <p class="font-semibold truncate">{{ item.title }}</p>
          <p v-if="item.variant_title" class="text-sm text-slate-400 truncate">{{ item.variant_title }}</p>
          <p class="text-primary">{{ cart.format(item.unit_price) }}</p>
        </div>
        <div class="flex items-center gap-4">
          <UInputNumber
            :model-value="item.quantity"
            :min="1"
            :disabled="updating === item.id"
            @update:model-value="(quantity) => onQuantityChange(item.id, quantity)"
          />
          <p class="w-24 text-right font-semibold">{{ cart.format(item.unit_price * item.quantity) }}</p>
          <UButton
            icon="i-lucide-trash-2"
            color="neutral"
            variant="ghost"
            :aria-label="t('cart.removeItemAriaLabel')"
            :disabled="updating === item.id"
            @click="onRemove(item.id)"
          />
        </div>
      </div>

      <CartSummary />

      <UButton to="/checkout" size="xl" class="self-end justify-center">{{ t('cart.checkoutButton') }}</UButton>
    </div>

    <div v-else class="flex flex-col items-center gap-4 py-12 text-center text-slate-400">
      <p>{{ t('cart.emptyMessage') }}</p>
      <UButton to="/products" variant="outline">{{ t('cart.continueShopping') }}</UButton>
    </div>
  </UContainer>
</template>
