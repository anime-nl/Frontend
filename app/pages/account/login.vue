<script setup lang="ts">
import {oauthProviders} from '#shared/utils/auth'

const {t} = useI18n()

const signingIn = ref<string | null>(null)
const error = ref('')

async function signIn(providerId: string) {
  error.value = ''
  signingIn.value = providerId
  try {
    const {location} = await $fetch<{location: string}>(`/api/auth/${providerId}/start`, {method: 'POST'})
    await navigateTo(location, {external: true})
  } catch (e) {
    console.error('Failed to start sign-in:', e)
    error.value = t('account.signInError')
    signingIn.value = null
  }
}
</script>

<template>
  <UContainer class="flex flex-col items-center gap-6 py-16">
    <h1 class="text-3xl font-bold">{{ t('account.signInTitle') }}</h1>
    <p class="max-w-sm text-center text-slate-400">
      {{ t('account.signInOptional') }}
    </p>
    <UAlert v-if="error" color="error" :description="error" icon="i-lucide-circle-alert" />
    <div class="flex w-full max-w-xs flex-col gap-3">
      <UButton
        v-for="provider in oauthProviders"
        :key="provider.id"
        :icon="provider.icon"
        :loading="signingIn === provider.id"
        size="xl"
        block
        @click="signIn(provider.id)"
      >
        {{ t(`account.oauth.${provider.id}`) }}
      </UButton>
    </div>
  </UContainer>
</template>
