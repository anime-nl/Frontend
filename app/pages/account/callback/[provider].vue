<script setup lang="ts">
import {isSupportedLocale} from '#shared/utils/i18n'

const {t} = useI18n()
const localePath = useLocalePath()
// The provider always redirects back to this page's own fixed, unprefixed URL (it's registered as
// such with the OAuth app), so the route itself carries no locale. The visitor's locale from
// before they left for sign-in only survives in the cookie @nuxtjs/i18n already maintains.
const cookieLocale = useCookieLocale()
const route = useRoute()
const customer = useCustomer()
const auth = useAuth()
const failed = ref(false)

// This exchange must run in the browser: completing it during server rendering would set the
// session cookie on an internal server-to-server response that never reaches the real browser
// response, leaving the visitor looping back to a signed-out /account.
onMounted(async () => {
  try {
    await auth.handleCallback(route.params.provider as string, route.query)
    await customer.refresh()
    await navigateTo(localePath('/account', isSupportedLocale(cookieLocale.value) ? cookieLocale.value : undefined))
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
