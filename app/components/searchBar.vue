<script lang="ts" setup>
const query = ref('')

const searchLink = computed(() => ({
  path: '/search',
  query: query.value.trim() ? {q: query.value.trim()} : {}
}))
</script>

<template>
  <div class="max-w-screen-2xl mx-auto p-4 md:p-8">
    <UFieldGroup size="xl" class="w-full">
      <UInput
        v-model="query"
        icon="i-lucide-search"
        placeholder="Search for TCG cards, figures, plushies and more..."
        class="flex-1"
      />
      <UButton :to="searchLink" label="Search" />
    </UFieldGroup>
  </div>
</template>
