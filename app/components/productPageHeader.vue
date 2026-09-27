<script lang="ts" setup>
defineProps<{
  badge?: string
  title: string
  description?: string
}>()
</script>

<template>
  <UPageHeader :title="title" :description="description">
    <template v-if="badge" #headline>
      <UBadge :label="badge" class="uppercase tracking-widest" color="primary" variant="subtle" />
    </template>
  </UPageHeader>
</template>
