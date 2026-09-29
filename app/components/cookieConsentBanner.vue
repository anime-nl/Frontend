<script lang="ts" setup>
import {getCookieConsent, isDoNotTrackEnabled, setCookieConsent} from '#shared/utils/cookieConsent'

const props = defineProps<{
  /** Whether this build has Google Analytics configured; the banner never shows otherwise */
  gaEnabled: boolean
}>()
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
</script>

<template>
  <UBanner
    v-if="showBanner"
    color="neutral"
    icon="i-lucide-cookie"
    title="We use cookies to understand how visitors use this site."
    :actions="[
      {label: 'Accept', color: 'primary', variant: 'solid', onClick: accept},
      {label: 'Decline', color: 'neutral', variant: 'solid', onClick: decline}
    ]"
  />
</template>
