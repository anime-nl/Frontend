<script lang="ts" setup>
import {getCookieConsent, isDoNotTrackEnabled, setCookieConsent} from '#shared/utils/cookieConsent'

const props = defineProps<{
  /** Whether this build has Google Analytics configured; the banner never shows otherwise */
  gaEnabled: boolean
}>()
const {t} = useI18n()
const {gtag, initialize} = useGtag()

const showBanner = ref(false)

onMounted(() => {
  if (!props.gaEnabled) return

  if (isDoNotTrackEnabled(navigator.doNotTrack)) {
    setCookieConsent('denied')
    return
  }

  const consent = getCookieConsent()
  if (consent === 'granted') {
    initialize()
  } else if (consent === null) {
    showBanner.value = true
  }
})

function accept() {
  setCookieConsent('granted')
  initialize()
  gtag('consent', 'update', {
    analytics_storage: 'granted',
    ad_storage: 'granted',
    ad_user_data: 'granted',
    ad_personalization: 'granted'
  })
  showBanner.value = false
}

function decline() {
  setCookieConsent('denied')
  showBanner.value = false
}

const actions = computed(() => [
  {label: t('cookieConsent.accept'), color: 'primary' as const, variant: 'solid' as const, onClick: accept},
  {label: t('cookieConsent.decline'), color: 'neutral' as const, variant: 'solid' as const, onClick: decline}
])
</script>

<template>
  <UBanner
    v-if="showBanner"
    color="neutral"
    icon="i-lucide-cookie"
    :title="t('cookieConsent.title')"
    :actions="actions"
  />
</template>
