<script lang="ts" setup>
const {t} = useI18n()
const {data: regionId} = await useDefaultRegionId()
const {data} = await useProductSearch(
  {fields: 'title,thumbnail', region_id: regionId, limit: 10, order: '-created_at'},
  'showcase-products'
)
const products = computed(() => (data.value?.products ?? []).filter((product) => product.thumbnail))
</script>

<template>
  <div v-if="products.length" class="w-full max-w-screen-2xl px-4 md:w-2/3 mx-auto my-16">
    <h1 class="mx-6 my-2 text-4xl">{{ t('home.newProducts') }}</h1>
    <UCarousel
      v-slot="{item}"
      :autoplay="{delay: 5000}"
      :items="products"
      :ui="{item: 'basis-full sm:basis-1/2 md:basis-1/3'}"
      arrows
      dots
      loop
    >
      <NuxtLinkLocale :to="`/product/${item.id}`" class="block">
        <img :src="item.thumbnail!" :alt="item.title" class="rounded-lg object-cover w-full h-100" loading="lazy" />
      </NuxtLinkLocale>
    </UCarousel>
  </div>
</template>
