<script lang="ts" setup>
const {
  public: {gaEnabled}
} = useRuntimeConfig()
const {t} = useI18n()

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

    <UBanner class="z-0" close icon="i-lucide-info" :title="t('common.underConstruction')" />

    <CookieConsentBanner :ga-enabled="gaEnabled" />

    <UMain>
      <NuxtPage />
    </UMain>
  </UApp>
</template>
