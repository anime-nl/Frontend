<script lang="ts" setup>
const {t} = useI18n()
const items = computed(() => buildNavigationItems(t))
const mobileMenuOpen = ref(false)
const cart = useCart()
const customer = useCustomer()

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
      <UChip
        :text="String(cart.count.value)"
        :show="cart.count.value > 0"
        color="primary"
        size="3xl"
        :ui="{base: 'h-[18px] min-w-[18px] px-1 text-[11px] leading-none'}"
      >
        <UButton
          to="/cart"
          icon="i-lucide-shopping-cart"
          color="neutral"
          variant="link"
          :aria-label="t('nav.cartAriaLabel')"
        />
      </UChip>

      <LocaleSwitcher />

      <UButton
        v-if="customer.customer.value"
        :label="customer.customer.value.first_name || t('nav.accountFallback')"
        to="/account"
        color="neutral"
        variant="link"
      />
      <UButton v-else :label="t('nav.logIn')" to="/account/login" color="neutral" variant="link" />

      <UButton
        class="lg:hidden"
        icon="i-lucide-menu"
        color="neutral"
        variant="ghost"
        :aria-label="t('nav.openMenuAriaLabel')"
        @click="mobileMenuOpen = true"
      />
    </div>
  </div>
  <hr class="text-gray-600" />

  <USlideover v-model:open="mobileMenuOpen" :title="t('nav.menuTitle')">
    <template #body>
      <UNavigationMenu :items="items" orientation="vertical" />
      <LocaleSwitcher class="mt-4" />
    </template>
  </USlideover>
</template>
