<script setup lang="ts">
const {t} = useI18n()
useSeoMeta({title: t('products.categories.plush.seoTitle'), description: t('products.categories.plush.description')})
</script>

<template>
  <CategoryPage
    :badge="t('products.badges.plushies')"
    :description="t('products.categories.plush.description')"
    handle="plush"
    :title="t('products.categories.plush.heading')"
  />
</template>
