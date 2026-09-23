<script setup>
import ProductCard from "~/components/productCard.vue";

const { data: products, pending, error } = await useFetch('/api/products')
</script>

<template>
  <div>
    <p v-if="pending">Loading...</p>

    <p v-if="error">Something went wrong while loading the products</p>

    <div v-if="products">
      <ProductCard
          v-for="product in products.products"
          :key="product.id"
          :product="product"
      />
    </div>
  </div>
</template>