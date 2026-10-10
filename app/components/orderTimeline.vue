<script setup lang="ts">
import {getOrderTimeline} from '#shared/utils/orderTimeline'

const props = defineProps<{
  paymentStatus?: string
  fulfillmentStatus?: string
}>()

const {t} = useI18n()
const steps = computed(() =>
  getOrderTimeline({payment_status: props.paymentStatus, fulfillment_status: props.fulfillmentStatus})
)
</script>

<template>
  <ol class="flex flex-col gap-4 sm:flex-row sm:justify-between">
    <li
      v-for="step in steps"
      :key="step.key"
      :data-state="step.state"
      class="flex items-center gap-3 sm:flex-1 sm:flex-col sm:text-center"
    >
      <UIcon
        :name="
          step.state === 'done'
            ? 'i-lucide-circle-check'
            : step.state === 'current'
              ? 'i-lucide-clock'
              : 'i-lucide-circle'
        "
        class="size-8"
        :class="step.state === 'done' ? 'text-primary' : step.state === 'current' ? 'text-white' : 'text-slate-500'"
      />
      <span :class="step.state === 'upcoming' ? 'text-slate-500' : 'font-semibold'">
        {{ t(`order.timeline.${step.key}`) }}
      </span>
    </li>
  </ol>
</template>
