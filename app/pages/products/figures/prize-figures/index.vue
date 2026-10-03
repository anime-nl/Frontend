<script setup lang="ts">
const {t} = useI18n()
useSeoMeta({
  title: t('products.categories.prizeFigures.seoTitle'),
  description: t('products.categories.prizeFigures.description')
})
</script>

<template>
  <CategoryPage
    :badge="t('products.badges.figures')"
    :description="t('products.categories.prizeFigures.description')"
    handle="prize-figures"
    :title="t('products.categories.prizeFigures.heading')"
  />
</template>
