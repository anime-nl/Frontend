<script setup lang="ts">
const {t} = useI18n()
useSeoMeta({title: t('products.categories.tcg.seoTitle'), description: t('products.categories.tcg.description')})
</script>

<template>
  <CategoryPage
    :badge="t('products.badges.tcg')"
    :description="t('products.categories.tcg.description')"
    handle="tcg"
    :title="t('products.categories.tcg.heading')"
  />
</template>
