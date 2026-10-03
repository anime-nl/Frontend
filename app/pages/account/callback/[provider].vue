<script setup lang="ts">
const {t} = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const customer = useCustomer()
const failed = ref(false)

// This exchange must run in the browser: completing it during server rendering would set the
// session cookie on an internal server-to-server response that never reaches the real browser
// response, leaving the visitor looping back to a signed-out /account.
onMounted(async () => {
  try {
    await $fetch(`/api/auth/${route.params.provider}/callback`, {method: 'POST', body: route.query})
    await customer.refresh()
    await navigateTo(localePath('/account'))
  } catch {
    failed.value = true
  }
})
</script>

<template>
  <UContainer v-if="failed" class="flex flex-col items-center gap-6 py-16 text-center">
    <p>{{ t('account.callback.failed') }}</p>
    <UButton to="/account/login">{{ t('account.callback.tryAgain') }}</UButton>
  </UContainer>
  <UContainer v-else class="flex flex-col items-center gap-6 py-16 text-center">
    <p>{{ t('account.callback.signingIn') }}</p>
  </UContainer>
</template>
