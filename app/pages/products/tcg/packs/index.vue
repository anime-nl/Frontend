<script setup lang="ts">
const {t} = useI18n()
useSeoMeta({title: t('products.categories.packs.seoTitle'), description: t('products.categories.packs.description')})
</script>

<template>
  <CategoryPage
    :badge="t('products.badges.tcg')"
    :description="t('products.categories.packs.description')"
    handle="packs"
    :title="t('products.categories.packs.heading')"
  />
</template>
