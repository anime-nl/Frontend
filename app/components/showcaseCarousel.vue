<script lang="ts" setup>
const {data: regionId} = await useDefaultRegionId()
const {data} = await useFetch('/api/products', {
  key: 'showcase-products',
  query: {fields: 'title,thumbnail', region_id: regionId}
})
const products = computed(() => (data.value?.products ?? []).filter((product) => product.thumbnail))
</script>

<template>
  <div v-if="products.length" class="w-full max-w-screen-2xl px-4 md:w-2/3 mx-auto my-16">
    <h1 class="mx-6 my-2 text-4xl">New Products</h1>
    <UCarousel
      v-slot="{item}"
      :autoplay="{delay: 5000}"
      :items="products"
      :ui="{item: 'basis-full sm:basis-1/2 md:basis-1/3'}"
      arrows
      dots
      loop
    >
      <NuxtLink :to="`/product/${item.id}`" class="block">
        <img
          :src="item.thumbnail!"
          :alt="item.title"
          class="rounded-lg object-cover"
          height="500"
          loading="lazy"
          width="800"
        />
      </NuxtLink>
    </UCarousel>
  </div>
</template>
