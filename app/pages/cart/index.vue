<script setup lang="ts">
// Blocks on the shared 'cart' key so this page's first render already has the cart, instead of
// flashing the empty state until useCart's own fetch resolves. useFetch dedupes by key, so this
// call (not useCart's own) is the one that actually fires and must carry the cookie-forwarding hook.
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
    <h1 class="text-3xl font-bold">Your cart</h1>

    <div v-if="cart.items.value.length" class="flex flex-col gap-6">
      <div
        v-for="item in cart.items.value"
        :key="item.id"
        class="flex items-center gap-4 border-b border-sky-200/20 pb-4"
      >
        <img v-if="item.thumbnail" :src="item.thumbnail" :alt="item.title" class="h-20 w-20 rounded-lg object-cover" />
        <div class="flex-1">
          <p class="font-semibold">{{ item.title }}</p>
          <p v-if="item.variant_title" class="text-sm text-slate-400">{{ item.variant_title }}</p>
          <p class="text-primary">{{ cart.format(item.unit_price) }}</p>
        </div>
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
          aria-label="Remove item"
          :disabled="updating === item.id"
          @click="onRemove(item.id)"
        />
      </div>

      <CartSummary />

      <UButton to="/checkout" size="xl" class="self-end justify-center">Checkout</UButton>
    </div>

    <div v-else class="flex flex-col items-center gap-4 py-12 text-center text-slate-400">
      <p>Your cart is empty.</p>
      <UButton to="/products" variant="outline">Continue shopping</UButton>
    </div>
  </UContainer>
</template>
