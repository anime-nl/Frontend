<script lang="ts" setup>
import type {NavigationMenuItem} from '@nuxt/ui'

const items: NavigationMenuItem[] = [
  {
    label: 'Home',
    icon: 'i-material-symbols:home',
    to: '/',
    class: "px-6"
  },
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
        description: 'Buy boxes filled with packs and extras.',
        icon: 'i-game-icons-ring-box',
        to: '/products/tcg/boosters',
      },
      {
        label: 'By series',
        description: 'Search for cards from the series you enjoy.',
        icon: 'i-mdi:search',
        to: '/search?category=tcg',
      },
    ]
  },
  {
    label: 'Figures',
    icon: 'i-game-icons-hooded-figure',
    to: '/products/figures',
    children: [
      {
        label: 'Prize Figures',
        description: 'Great figures for low prices.',
        icon: 'i-mdi:prize',
        to: '/products/figures/prize-figures',
      },
      {
        label: 'Scale Figures',
        description: 'Great for decorating.',
        icon: 'i-mdi:ruler',
        to: '/products/figures/scale-figures',
      },
      {
        label: 'Noodle Stoppers',
        description: 'Figures with a function',
        icon: 'i-mdi:cup',
        to: '/products/figures/noodle-stoppers',
      },
      {
        label: 'By series',
        description: 'Search for figures from the series you enjoy.',
        icon: 'i-mdi:search',
        to: '/search?category=figures',
      },
    ]
  },
  {
    label: 'Plushies',
    icon: 'i-mdi-teddy-bear',
    to: '/products/plush',
    children: [
      {
        label: 'By series',
        description: 'Search for plushies from the series you enjoy.',
        icon: 'i-mdi:search',
        to: '/search?category=plushies',
      },
    ]
  },
  {
    label: 'Keychains',
    icon: 'i-pinhead-key-with-house-keychain',
    to: '/products/keychains',
    children: [
      {
        label: 'Acrylic keychains',
        description: 'A wide selection of cheap keychains.',
        icon: 'i-at-icons:glass-pane',
        to: '/products/keychains/acrylic',
      },
      {
        label: 'Metal keychains',
        description: 'Super durable keychains.',
        icon: 'i-game-icons:metal-bar',
        to: '/products/keychains/metal',
      },
      {
        label: 'By series',
        description: 'Search for keychains from the series you enjoy.',
        icon: 'i-mdi:search',
        to: '/search?category=keychains',
      },
    ]
  },
  {
    label: 'Support',
    icon: 'i-lucide-life-buoy',
    to: '/support',
  },
  {
    label: 'Trustpilot',
    icon: 'i-simple-icons-trustpilot',
    badge: '4.0',
    to: 'https://www.trustpilot.com/review/animenl.nl',
    target: '_blank'
  }
]
</script>

<template>
  <div class="flex justify-center items-center w-full z-50">
    <UNavigationMenu :items="items"/>
  </div>
  <hr class="text-gray-600" />
</template>