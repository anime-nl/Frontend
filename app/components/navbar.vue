<script lang="ts" setup>
const items = navigationItems
const mobileMenuOpen = ref(false)
const cart = useCart()

const route = useRoute()
watch(
  () => route.fullPath,
  () => {
    mobileMenuOpen.value = false
  }
)
</script>

<template>
  <div class="flex justify-between lg:justify-center items-center w-full z-50 px-4 py-2 lg:py-0">
    <UNavigationMenu :items="items" class="hidden lg:flex" />

    <div class="flex items-center gap-2">
      <UChip :text="String(cart.count.value)" :show="cart.count.value > 0" color="primary" size="sm">
        <UButton to="/cart" icon="i-lucide-shopping-cart" color="neutral" variant="ghost" aria-label="Cart" />
      </UChip>

      <UButton
        class="lg:hidden"
        icon="i-lucide-menu"
        color="neutral"
        variant="ghost"
        aria-label="Open menu"
        @click="mobileMenuOpen = true"
      />
    </div>
  </div>
  <hr class="text-gray-600" />

  <USlideover v-model:open="mobileMenuOpen" title="Menu">
    <template #body>
      <UNavigationMenu :items="items" orientation="vertical" />
    </template>
  </USlideover>
</template>
