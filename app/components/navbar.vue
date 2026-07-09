<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const items = ref<NavigationMenuItem[]>([
  {
    label: 'TCG',
    icon: 'i-material-symbols-light:playing-cards',
    to: '/products/tcg',
    children: [
      {
        label: 'Singles',
        description: 'Buy single cards in bulk.',
        icon: 'i-mdi-cards-playing-diamond',
        to: '/products/tcg/singles',
      },
      {
        label: 'Packs',
        description: 'Test your luck with single packs.',
        icon: 'i-mdi-cards-playing-diamond',
        to: '/products/tcg/packs',
      },
      {
        label: 'Booster Boxes',
        description: 'Buy boxes fill with packs and extra\'s.',
        icon: 'i-game-icons-ring-box',
        to: '/products/tcg/boosters',
      },
    ]
  },
  {
    label: 'Figures',
    icon: 'i-game-icons-hooded-figure',
    to: '/products/figures',
    children: [
    ]
  },
  {
    label: 'Plushies',
    icon: 'i-mdi-teddy-bear',
    to: '/products/plush',
    children: [
    ]
  },
  {
    label: 'Keychains',
    icon: 'i-pinhead-key-with-house-keychain',
    to: '/products/keychains',
    children: [
    ]
  },
  {
    label: 'Trustpilot',
    icon: 'i-simple-icons-trustpilot',
    badge: '4.0',
    to: 'https://www.trustpilot.com/review/animenl.nl',
    target: '_blank'
  }
])
</script>

<template>
    <div class="flex justify-center items-center w-full">
      <UNavigationMenu :items="items" />
    </div>
</template>

<style scoped>
</style>