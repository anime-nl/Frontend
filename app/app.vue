<script lang="ts" setup>
const {
  public: {gaEnabled}
} = useRuntimeConfig()
const {t} = useI18n()
const localePath = useLocalePath()

const i18nHead = useLocaleHead()
useHead(() => ({
  htmlAttrs: {lang: i18nHead.value.htmlAttrs?.lang},
  link: [...(i18nHead.value.link || [])],
  meta: [...(i18nHead.value.meta || [])]
}))
</script>

<template>
  <UApp>
    <Navbar />

    <UBanner
      class="z-0"
      color="warning"
      icon="i-lucide-triangle-alert"
      :title="t('common.paymentIssues')"
      :actions="[
        {
          label: t('common.paymentIssuesContactLink'),
          to: localePath('/support'),
          color: 'error',
          variant: 'link',
          class: 'whitespace-normal text-left'
        }
      ]"
      :ui="{
        container: 'flex-col items-start gap-1 py-2 lg:h-auto lg:flex-row lg:items-center lg:gap-3',
        center: 'items-start',
        title: 'whitespace-normal'
      }"
    />

    <UBanner class="z-0" close icon="i-lucide-info" :title="t('common.underConstruction')" />

    <CookieConsentBanner :ga-enabled="gaEnabled" />

    <UMain>
      <NuxtPage />
    </UMain>
  </UApp>
</template>
