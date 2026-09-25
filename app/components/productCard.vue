<script lang="ts" setup>
const props = defineProps(['product'])

const price = computed(() => {
  const calculated = props.product?.variants?.[0]?.calculated_price
  if (!calculated) return null

  return {
    amount: calculated.calculated_amount,
    currency: calculated.currency_code.toUpperCase()
  }
})
</script>

<template>
  <NuxtLink :to="`/product/${product.id}`" class="block">
    <div class="min-w-64 h-full rounded-2xl snap-center bg-gray-900">
      <div class="text-white relative h-full group overflow-hidden rounded-2xl">
        <img
          v-if="product.thumbnail"
          :src="product.thumbnail"
          alt="product-image"
          class="object-cover absolute w-full h-full bottom-0 top-0 z-0"
        />

        <div
          class="bg-black/70 bottom-0 absolute w-full p-6 rounded-b-2xl translate-y-full group-hover:translate-y-0 transition-all duration-150 ease-in-out z-10"
        >
          <div class="mb-2">
            <p>
              <b>{{ product.title }}</b>
            </p>
          </div>

          <hr class="border-gray-500 my-2" />

          <p v-if="price" class="font-medium text-[#3fa3ee]">{{ price.amount.toFixed(2) }} {{ price.currency }}</p>
          <p v-else class="text-sm text-gray-400">Price unavailable</p>
        </div>
      </div>
    </div>
  </NuxtLink>
</template>
