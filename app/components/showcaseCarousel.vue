<script lang="ts" setup>
const items = [
  'https://picsum.photos/800/500?random=1',
  'https://picsum.photos/800/500?random=2',
  'https://picsum.photos/800/500?random=3',
  'https://picsum.photos/800/500?random=4',
  'https://picsum.photos/800/500?random=5',
  'https://picsum.photos/800/500?random=6'
]
</script>

<template>
  <div class="w-2/3 mx-auto my-16">
    <UCarousel
        v-slot="{ item }"
        :autoplay="{ delay: 5000 }"
        :items="items"
        :ui="{ item: 'basis-1/3' }"
        arrows
        dots
        loop
    >
      <img :src="item" alt="showcase" class="rounded-lg" height="500" loading="lazy" width="800">
    </UCarousel>
  </div>
</template>
