<script setup lang="ts">
const {t} = useI18n()
useSeoMeta({
  title: t('products.categories.figures.seoTitle'),
  description: t('products.categories.figures.description')
})
</script>

<template>
  <CategoryPage
    :badge="t('products.badges.figures')"
    :description="t('products.categories.figures.description')"
    handle="figures"
    :title="t('products.categories.figures.heading')"
  />
</template>
