<script setup lang="ts">
import type {StoreOrder} from '@medusajs/types'

type CompleteResponse =
  {status: 'completed'; order: StoreOrder; token?: string} | {status: 'pending' | 'failed'; cart?: unknown}

/** Mollie can take a while to report a payment as paid, so the page keeps asking for about a minute. */
const POLL_INTERVAL_MS = 3000
const MAX_POLLS = 20

const {t} = useI18n()
const localePath = useLocalePath()

// useFetch (not a plain $fetch) is required here: only useFetch forwards the browser's cookies to
// this internal API call during server-side rendering, which /api/checkout/complete needs to read
// the cart_id cookie. A plain $fetch would always see no cookie on the first, server-rendered paint.
const requestEvent = useRequestEvent()
const {data, error} = await useFetch<CompleteResponse>('/api/checkout/complete', {
  method: 'POST',
  onResponse: ({response}) => forwardSetCookie(requestEvent, response)
})

const polled = ref<CompleteResponse | null>(null)
const cartGone = ref(false)
const timedOut = ref(false)

// The complete route (and the Mollie provider behind it) cannot always tell "still processing" apart
// from "genuinely failed" — see docs/known-issues.md. Only a confident 'failed' response from the API
// is shown as failed; every other error defaults to 'pending' rather than risk telling a customer
// their successful payment failed. A 400 means there was no cart_id cookie at all (a stale bookmark,
// or a reload after the cart was already cleared on a completed order) - nothing to report either way.
const status = computed<'completed' | 'pending' | 'failed' | 'idle'>(() => {
  if (cartGone.value) return 'idle'
  const latest = polled.value ?? data.value
  if (latest) return latest.status
  if (error.value?.statusCode === 400) return 'idle'
  return 'pending'
})
const order = computed(() => {
  const latest = polled.value ?? data.value
  return latest?.status === 'completed' ? latest.order : null
})
const orderToken = computed(() => {
  const latest = polled.value ?? data.value
  return latest?.status === 'completed' ? latest.token : undefined
})

const cart = useCart()
const customer = useCustomer()

/**
 * Clears the cart in the UI and, when the order has a signed link, moves on to the order overview.
 * Without a token (no ORDER_LINK_SECRET configured) the confirmation stays on this page.
 */
async function onCompleted() {
  await cart.refresh()
  if (order.value && orderToken.value) {
    await navigateTo(localePath({path: `/orders/${order.value.id}`, query: {token: orderToken.value}}), {
      replace: true
    })
  }
}

let pollTimer: ReturnType<typeof setTimeout> | undefined
let unmounted = false

/**
 * Asks for the order again every few seconds until the payment is paid or failed, or the attempts run out.
 * A 400 means the cart cookie is gone, so the order was already completed elsewhere (another tab or Mollie's webhook).
 */
async function pollUntilSettled() {
  for (let attempt = 0; attempt < MAX_POLLS; attempt++) {
    await new Promise((resolve) => (pollTimer = setTimeout(resolve, POLL_INTERVAL_MS)))
    if (unmounted) return

    try {
      polled.value = await $fetch<CompleteResponse>('/api/checkout/complete', {method: 'POST'})
    } catch (pollError) {
      if ((pollError as {statusCode?: number}).statusCode === 400) {
        cartGone.value = true
        return
      }
    }

    if (status.value === 'completed') return onCompleted()
    if (status.value === 'failed') return
  }
  timedOut.value = true
}

if (status.value === 'completed') {
  await onCompleted()
}

onMounted(() => {
  if (status.value === 'pending') pollUntilSettled()
})

onBeforeUnmount(() => {
  unmounted = true
  clearTimeout(pollTimer)
})
</script>

<template>
  <UContainer class="flex flex-col items-center gap-6 py-16 text-center">
    <template v-if="status === 'completed'">
      <UIcon name="i-lucide-circle-check" class="text-primary size-16" />
      <h1 class="text-3xl font-bold">{{ t('checkout.return.completedTitle') }}</h1>
      <p class="text-slate-300">{{ t('checkout.return.orderPlaced', {number: order?.display_id}) }}</p>
      <UButton v-if="customer.customer.value" to="/account" :label="t('checkout.return.viewOrders')" />
    </template>

    <template v-else-if="status === 'pending'">
      <UIcon name="i-lucide-clock" class="size-16" />
      <h1 class="text-3xl font-bold">{{ t('checkout.return.pendingTitle') }}</h1>
      <p class="text-slate-300">
        {{ t(timedOut ? 'checkout.return.pendingTimeoutBody' : 'checkout.return.pendingBody') }}
      </p>
    </template>

    <template v-else-if="status === 'failed'">
      <UIcon name="i-lucide-circle-alert" class="text-error size-16" />
      <h1 class="text-3xl font-bold">{{ t('checkout.return.failedTitle') }}</h1>
      <p class="text-slate-300">{{ t('checkout.return.failedBody') }}</p>
      <UButton to="/cart" :label="t('checkout.return.backToCart')" />
    </template>

    <template v-else>
      <UIcon name="i-lucide-info" class="size-16" />
      <h1 class="text-3xl font-bold">{{ t('checkout.return.idleTitle') }}</h1>
      <p class="text-slate-300">{{ t('checkout.return.idleBody') }}</p>
      <UButton to="/" :label="t('cart.continueShopping')" />
    </template>
  </UContainer>
</template>
