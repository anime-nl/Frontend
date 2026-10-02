<script lang="ts" setup>
const cart = useCart()

const code = ref('')
const applying = ref(false)
const promoError = ref('')
const removing = ref<string | null>(null)

async function onApplyCode() {
  const trimmed = code.value.trim()
  if (!trimmed) return

  applying.value = true
  promoError.value = ''
  try {
    await cart.applyPromoCode(trimmed)
    code.value = ''
  } catch (error) {
    promoError.value = (error as {statusMessage?: string}).statusMessage ?? 'That promo code is not valid.'
  } finally {
    applying.value = false
  }
}

async function onRemoveCode(promoCode: string) {
  removing.value = promoCode
  promoError.value = ''
  try {
    await cart.removePromoCode(promoCode)
  } catch {
    promoError.value = 'That promo code could not be removed. Please try again.'
  } finally {
    removing.value = null
  }
}
</script>

<template>
  <div class="flex flex-col gap-3">
    <div v-if="cart.subtotal.value" class="flex justify-between text-slate-300">
      <span>Price excl. VAT</span>
      <span>{{ cart.subtotal.value }}</span>
    </div>
    <div v-if="cart.taxTotal.value" class="flex justify-between text-slate-300">
      <span>VAT</span>
      <span>{{ cart.taxTotal.value }}</span>
    </div>
    <div v-if="cart.discountTotal.value" class="flex justify-between text-slate-300">
      <span>Discount</span>
      <span>-{{ cart.discountTotal.value }}</span>
    </div>

    <div class="flex flex-col gap-2">
      <UFieldGroup>
        <UInput v-model="code" placeholder="Promo code" class="flex-1" @keyup.enter="onApplyCode" />
        <UButton label="Apply" :loading="applying" @click="onApplyCode" />
      </UFieldGroup>

      <div v-for="promotion in cart.promotions.value" :key="promotion.id" class="flex items-center justify-between">
        <UBadge :label="promotion.code ?? ''" color="primary" variant="subtle" />
        <UButton
          v-if="!promotion.is_automatic"
          icon="i-lucide-x"
          color="neutral"
          variant="ghost"
          size="xs"
          :aria-label="`Remove ${promotion.code}`"
          :disabled="removing === promotion.code"
          @click="onRemoveCode(promotion.code ?? '')"
        />
      </div>

      <UAlert v-if="promoError" color="error" variant="subtle" icon="i-lucide-circle-alert" :description="promoError" />
    </div>

    <div class="flex justify-between text-xl font-bold">
      <span>Subtotal</span>
      <span>{{ cart.subtotalInclTax.value }}</span>
    </div>
    <div class="flex justify-between text-xl font-bold">
      <span>Total</span>
      <span>{{ cart.total.value }}</span>
    </div>
  </div>
</template>
