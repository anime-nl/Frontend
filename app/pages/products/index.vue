<script lang="ts" setup>
// Not linked from navigation and duplicates /search without its filters, so keep it out of search results.
useSeoMeta({robots: 'noindex'})

const {t} = useI18n()
const {data, pending, error} = await useProductSearch(
  {limit: 24, fields: 'title,thumbnail,*variants.calculated_price'},
  'products-index'
)
</script>

<template>
  <div>
    <p v-if="pending">{{ t('products.loading') }}</p>

    <p v-if="error">{{ t('products.loadError') }}</p>

    <div v-if="data">
      <ProductCard v-for="product in data.products" :key="product.id" :product="product" />
    </div>
  </div>
</template>
