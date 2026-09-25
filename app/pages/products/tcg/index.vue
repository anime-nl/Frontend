<script lang="ts" setup>
const client = useMedusaClient()

const {data} = await useAsyncData('tcg-products', () =>
  client.store.product.list({
    fields: 'title,thumbnail,variants.prices.*'
  })
)
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
