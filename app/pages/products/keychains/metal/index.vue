<script setup lang="ts">
const {t} = useI18n()
useSeoMeta({title: t('products.categories.metal.seoTitle'), description: t('products.categories.metal.description')})
</script>

<template>
  <CategoryPage
    :badge="t('products.badges.keychains')"
    :description="t('products.categories.metal.description')"
    handle="metal-keychains"
    :title="t('products.categories.metal.heading')"
  />
</template>
