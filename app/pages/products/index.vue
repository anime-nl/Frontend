<script lang="ts" setup>
const {data, pending, error} = await useFetch('/api/products')
</script>

<template>
  <div>
    <p v-if="pending">Loading...</p>

    <p v-if="error">Something went wrong while loading the products</p>

    <div v-if="data">
      <ProductCard
          v-for="product in data.products"
          :key="product.id"
          :product="product"
      />
    </div>
  </div>
</template>
