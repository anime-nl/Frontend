<script lang="ts" setup>
const props = defineProps<{
  handle: string
  badge?: string
  title: string
  description?: string
}>()

const {t} = useI18n()
const {data} = await useCategoryProducts(props.handle)
const products = computed(() => data.value ?? [])
</script>

<template>
  <UContainer class="flex flex-col gap-8">
    <ProductPageHeader :badge="badge" :title="title" :description="description" />
    <UPageColumns v-if="products.length">
      <ProductCard v-for="product in products" :key="product.id" :product="product" class="h-100" />
    </UPageColumns>
    <p v-else class="text-center text-slate-400 py-12">{{ t('products.emptyCategory') }}</p>
  </UContainer>
</template>
