<script setup lang="ts">
const {t} = useI18n()
useSeoMeta({
  title: t('products.categories.boosters.seoTitle'),
  description: t('products.categories.boosters.description')
})
</script>

<template>
  <CategoryPage
    :badge="t('products.badges.tcg')"
    :description="t('products.categories.boosters.description')"
    handle="boosters"
    :title="t('products.categories.boosters.heading')"
  />
</template>
