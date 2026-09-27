<script setup lang="ts">
// Blocks on the shared 'cart' key so this page's first render already has the cart, instead of
// flashing the empty state until useCart's own fetch resolves
await useFetch('/api/cart', {key: 'cart'})
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

const format = (amount: number) => {
  const currency = cart.cart.value?.currency_code?.toUpperCase()
  return currency ? new Intl.NumberFormat('nl-NL', {style: 'currency', currency}).format(amount) : ''
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
          <p class="text-primary">{{ format(item.unit_price) }}</p>
        </div>
        <UInputNumber
          :model-value="item.quantity"
          :min="1"
          :disabled="updating === item.id"
          @update:model-value="(quantity) => onQuantityChange(item.id, quantity)"
        />
        <p class="w-24 text-right font-semibold">{{ format(item.unit_price * item.quantity) }}</p>
        <UButton
          icon="i-lucide-trash-2"
          color="neutral"
          variant="ghost"
          aria-label="Remove item"
          :disabled="updating === item.id"
          @click="onRemove(item.id)"
        />
      </div>

      <div class="flex justify-end gap-8 text-xl font-bold">
        <span>Subtotal</span>
        <span>{{ format(cart.cart.value?.subtotal ?? 0) }}</span>
      </div>

      <UButton to="/checkout" size="xl" class="self-end justify-center">Checkout</UButton>
    </div>

    <div v-else class="flex flex-col items-center gap-4 py-12 text-center text-slate-400">
      <p>Your cart is empty.</p>
      <UButton to="/products" variant="outline">Continue shopping</UButton>
    </div>
  </UContainer>
</template>
