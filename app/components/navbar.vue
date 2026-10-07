<script lang="ts" setup>
const {t} = useI18n()
const localePath = useLocalePath()
const items = computed(() => buildNavigationItems(t, localePath))
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
  <div class="flex items-center justify-between w-full z-50 px-4 py-2 lg:py-0 gap-2">
    <UChip
      :text="String(cart.count.value)"
      :show="cart.count.value > 0"
      color="primary"
      size="3xl"
      :ui="{base: 'h-[18px] min-w-[18px] px-1 text-[11px] leading-none'}"
      class="order-1 lg:order-4"
    >
      <UButton
        to="/cart"
        icon="i-lucide-shopping-cart"
        color="neutral"
        variant="link"
        :aria-label="t('nav.cartAriaLabel')"
      />
    </UChip>

    <div class="hidden lg:flex lg:order-1">
      <LocaleSwitcher />
    </div>

    <div class="hidden lg:flex lg:order-2 lg:flex-1 lg:justify-center">
      <UNavigationMenu :items="items" />
    </div>

    <UButton
      v-if="customer.customer.value"
      :label="customer.customer.value.first_name || t('nav.accountFallback')"
      to="/account"
      color="neutral"
      variant="link"
      class="hidden lg:flex lg:order-3"
    />
    <UButton
      v-else
      :label="t('nav.logIn')"
      to="/account/login"
      color="neutral"
      variant="link"
      class="hidden lg:flex lg:order-3"
    />

    <UButton
      class="order-2 lg:hidden"
      icon="i-lucide-menu"
      color="neutral"
      variant="ghost"
      :aria-label="t('nav.openMenuAriaLabel')"
      @click="mobileMenuOpen = true"
    />
  </div>
  <hr class="text-gray-600" />

  <USlideover v-model:open="mobileMenuOpen" :title="t('nav.menuTitle')">
    <template #body>
      <UNavigationMenu :items="items" orientation="vertical" />
      <USeparator class="my-4" />
      <div class="flex flex-col gap-3">
        <UButton
          v-if="customer.customer.value"
          :label="customer.customer.value.first_name || t('nav.accountFallback')"
          to="/account"
          color="neutral"
          variant="outline"
          block
        />
        <UButton v-else :label="t('nav.logIn')" to="/account/login" color="neutral" variant="outline" block />
        <LocaleSwitcher />
      </div>
    </template>
  </USlideover>
</template>
