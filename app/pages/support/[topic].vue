<script lang="ts" setup>
import {findSupportTopic, supportLimits, validateSupportRequest} from '#shared/utils/support'
import type {SupportRequest} from '#shared/utils/support'

const route = useRoute()
const topic = findSupportTopic(route.params.topic)

if (!topic) {
  throw createError({statusCode: 404, statusMessage: 'Support topic not found', fatal: true})
}

useSeoMeta({
  title: `${topic.title} | Support | AnimeNL`,
  description: topic.intro
})

const {supportEmail} = useRuntimeConfig().public

const state = reactive<SupportRequest>({
  topic: topic.slug,
  name: '',
  email: '',
  orderNumber: '',
  reason: topic.reasons[0]!,
  message: '',
  website: ''
})

const submitting = ref(false)
const sent = ref(false)
const submitError = ref('')

async function onSubmit() {
  submitting.value = true
  submitError.value = ''

  try {
    await $fetch('/api/support', {method: 'POST', body: state})
    sent.value = true
  } catch {
    submitError.value = `Something went wrong while sending your message. Please try again, or email us at ${supportEmail}.`
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto p-4 md:p-8 flex flex-col gap-8">
    <UBreadcrumb :items="[{label: 'Home', to: '/'}, {label: 'Support', to: '/support'}, {label: topic.title}]" />

    <header class="flex flex-col gap-3">
      <div class="flex items-center gap-3">
        <UIcon :name="topic.icon" class="text-4xl text-primary" />
        <h1 class="text-4xl font-bold">{{ topic.title }}</h1>
      </div>
      <p class="text-lg text-slate-300">{{ topic.intro }}</p>
    </header>

    <UCard v-if="sent">
      <div class="flex flex-col items-start gap-4">
        <UIcon name="i-lucide-circle-check" class="text-4xl text-success" />
        <div>
          <h2 class="text-2xl font-semibold">Message sent</h2>
          <p class="text-slate-300">
            Thanks {{ state.name }}, we received your message and will reply to {{ state.email }}.
          </p>
        </div>
        <UButton to="/support" label="Back to support" color="neutral" variant="outline" />
      </div>
    </UCard>

    <UCard v-else>
      <UForm :state="state" :validate="validateSupportRequest" class="flex flex-col gap-5" @submit="onSubmit">
        <UFormField name="reason" label="What do you need help with?" required>
          <USelect v-model="state.reason" :items="topic.reasons" class="w-full" />
        </UFormField>

        <UFormField
          name="orderNumber"
          label="Order number"
          :required="topic.orderNumberRequired"
          :hint="topic.orderNumberRequired ? undefined : 'Optional'"
        >
          <UInput v-model="state.orderNumber" :maxlength="supportLimits.orderNumber" class="w-full" />
        </UFormField>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <UFormField name="name" label="Your name" required>
            <UInput v-model="state.name" autocomplete="name" :maxlength="supportLimits.name" class="w-full" />
          </UFormField>

          <UFormField name="email" label="Email address" required>
            <UInput
              v-model="state.email"
              type="email"
              autocomplete="email"
              :maxlength="supportLimits.email"
              class="w-full"
            />
          </UFormField>
        </div>

        <UFormField name="message" label="Message" required>
          <UTextarea
            v-model="state.message"
            :rows="6"
            :maxlength="supportLimits.message"
            :placeholder="topic.messagePlaceholder"
            class="w-full"
          />
        </UFormField>

        <!-- Honeypot -->
        <div class="hidden" aria-hidden="true">
          <label
            >Leave this field empty
            <input v-model="state.website" type="text" name="website" tabindex="-1" autocomplete="off" />
          </label>
        </div>

        <UAlert
          v-if="submitError"
          color="error"
          variant="subtle"
          icon="i-lucide-circle-alert"
          :description="submitError"
        />

        <div class="flex flex-wrap items-center gap-3">
          <UButton type="submit" label="Send message" icon="i-lucide-send" size="lg" :loading="submitting" />
          <UButton to="/support" label="Cancel" color="neutral" variant="ghost" size="lg" />
        </div>
      </UForm>
    </UCard>
  </div>
</template>
