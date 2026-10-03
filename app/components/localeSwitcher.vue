<script lang="ts" setup>
import type {LocaleObject} from '@nuxtjs/i18n'
import type {DropdownMenuItem} from '@nuxt/ui'

const {locale, locales, localeProperties} = useI18n()
const switchLocalePath = useSwitchLocalePath()

const items = computed<DropdownMenuItem[]>(() =>
  (locales.value as LocaleObject[]).map((l) => ({
    label: l.name,
    to: switchLocalePath(l.code),
    // switchLocalePath() already resolves the target locale's path; without this, Nuxt UI's own
    // ULink re-localizes `to` using the CURRENT locale, which silently overwrites an unprefixed
    // (default-locale) target back to the current locale's path.
    locale: false,
    active: l.code === locale.value
  }))
)
</script>

<template>
  <UDropdownMenu :items="items">
    <UButton :label="localeProperties.name" icon="i-lucide-globe" color="neutral" variant="link" />
  </UDropdownMenu>
</template>
