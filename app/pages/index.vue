<script lang="ts" setup>
const {t} = useI18n()
useSeoMeta({title: t('home.title'), description: t('home.description')})
</script>

<template>
  <div>
    <ShowcaseCarousel />
    <SearchBar />
    <RandomProductGrid />
  </div>
</template>
