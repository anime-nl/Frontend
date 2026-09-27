<script lang="ts" setup>
const items = navigationItems
</script>

<template>
  <div class="flex justify-center items-center w-full z-50">
    <UNavigationMenu :items="items" />
  </div>
  <hr class="text-gray-600" />
</template>
