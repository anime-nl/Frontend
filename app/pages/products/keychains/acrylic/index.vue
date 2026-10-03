<script setup lang="ts">
const {t} = useI18n()
useSeoMeta({
  title: t('products.categories.acrylic.seoTitle'),
  description: t('products.categories.acrylic.description')
})
</script>

<template>
  <CategoryPage
    :badge="t('products.badges.keychains')"
    :description="t('products.categories.acrylic.description')"
    handle="acrylic"
    :title="t('products.categories.acrylic.heading')"
  />
</template>
