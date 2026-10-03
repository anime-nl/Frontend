<script setup lang="ts">
const {t} = useI18n()
useSeoMeta({
  title: t('products.categories.scaleFigures.seoTitle'),
  description: t('products.categories.scaleFigures.description')
})
</script>

<template>
  <CategoryPage
    :badge="t('products.badges.figures')"
    :description="t('products.categories.scaleFigures.description')"
    handle="scale-figures"
    :title="t('products.categories.scaleFigures.heading')"
  />
</template>
