<script lang="ts" setup>
const {t} = useI18n()
const localePath = useLocalePath()
const query = ref('')

const searchLink = computed(() =>
  localePath({path: '/search', query: query.value.trim() ? {q: query.value.trim()} : {}})
)
</script>

<template>
  <div class="max-w-screen-2xl mx-auto p-4 md:p-8">
    <UFieldGroup size="xl" class="w-full">
      <UInput v-model="query" icon="i-lucide-search" :placeholder="t('search.placeholder')" class="flex-1" />
      <UButton :to="searchLink" :label="t('search.button')" />
    </UFieldGroup>
  </div>
</template>
