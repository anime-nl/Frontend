<script lang="ts" setup>
const {data} = await useFetch('/api/products', {
  key: 'tcg-products',
  query: {fields: 'title,thumbnail,variants.prices.*'}
})
const products = computed(() => data.value?.products ?? [])
</script>

<template>
  <ProductPageHeader
    badge="TCG"
    title="Trading Card Game (TCG) Collection"
    description="Browse our entire catalog of Trading Card Game products."
  />
  <UPageColumns>
    <ProductCard v-for="product in products" :key="product.id" :product="product" class="snap-center" />
  </UPageColumns>
</template>
