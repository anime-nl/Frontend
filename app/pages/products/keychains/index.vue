<script setup lang="ts">
const {t} = useI18n()
useSeoMeta({
  title: t('products.categories.keychains.seoTitle'),
  description: t('products.categories.keychains.description')
})
</script>

<template>
  <CategoryPage
    :badge="t('products.badges.keychains')"
    :description="t('products.categories.keychains.description')"
    handle="keychains"
    :title="t('products.categories.keychains.heading')"
  />
</template>
