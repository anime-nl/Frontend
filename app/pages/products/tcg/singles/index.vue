<script setup lang="ts">
const {t} = useI18n()
useSeoMeta({
  title: t('products.categories.singles.seoTitle'),
  description: t('products.categories.singles.description')
})
</script>

<template>
  <CategoryPage
    :badge="t('products.badges.tcg')"
    :description="t('products.categories.singles.description')"
    handle="singles"
    :title="t('products.categories.singles.heading')"
  />
</template>
