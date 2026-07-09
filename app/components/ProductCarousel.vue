<script setup lang="ts">
const client = useMedusaClient();
const { products } = await client.store.product.list({
  fields: "title,thumbnail,variants.prices.*"
});
</script>

<template>
  <div class="h-full m-4">
    <h1 class="mx-6 my-2 text-5xl">New Products</h1>
    <div class="h-128 mx-6 mt-6 pb-6 flex flex-row gap-5 overflow-x-scroll snap-x snap-mandatory">
      <ProductCard v-for="product in products" :product="product" />
    </div>
  </div>
</template>

<style scoped>

</style>