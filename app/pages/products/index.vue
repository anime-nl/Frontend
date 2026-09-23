<script setup lang="ts">
const props = defineProps(['title'])
const client = useMedusaClient();
const productListRef = ref<HTMLElement | null>(null);

const {data} = await useAsyncData('products-key', () =>
    client.store.product.list({
      fields: "title,thumbnail,variants.prices.*"
    })
)
const products = computed(() => data.value?.products ?? [])

</script>
<template>
  <UPageColumns>
    <ProductCard v-for="product in products" :key="product.id" :product="product" class="snap-center"/>
  </UPageColumns>
</template>