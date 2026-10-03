<script setup lang="ts">
const {t} = useI18n()
useSeoMeta({
  title: t('products.categories.noodleStoppers.seoTitle'),
  description: t('products.categories.noodleStoppers.description')
})
</script>

<template>
  <CategoryPage
    :badge="t('products.badges.figures')"
    :description="t('products.categories.noodleStoppers.description')"
    handle="noodle-stoppers"
    :title="t('products.categories.noodleStoppers.heading')"
  />
</template>
