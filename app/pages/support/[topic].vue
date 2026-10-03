<script lang="ts" setup>
import {findSupportTopic, supportLimits, validateSupportRequest} from '#shared/utils/support'
import type {SupportRequest} from '#shared/utils/support'

const route = useRoute()
const topic = findSupportTopic(route.params.topic)

if (!topic) {
  throw createError({statusCode: 404, statusMessage: 'Support topic not found', fatal: true})
}

const {t, locale} = useI18n()
const topicTitle = computed(() => t(`support.topics.${topic.slug}.title`))
const topicIntro = computed(() => t(`support.topics.${topic.slug}.intro`))
const topicMessagePlaceholder = computed(() => t(`support.topics.${topic.slug}.messagePlaceholder`))
const reasonItems = computed(() =>
  topic.reasons.map((reason) => ({label: t(`support.topics.${topic.slug}.reasons.${reason}`), value: reason}))
)

useSeoMeta({
  title: () => `${topicTitle.value} | Support`,
  description: topicIntro
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

function validate(input: SupportRequest) {
  return validateSupportRequest(input).map((error) => ({
    name: error.name,
    message: t(`validation.${error.code}`, error.params ?? {})
  }))
}

const submitting = ref(false)
const sent = ref(false)
const submitError = ref('')

async function onSubmit() {
  submitting.value = true
  submitError.value = ''

  try {
    await $fetch('/api/support', {
      method: 'POST',
      body: state,
      headers: {'x-site-locale': locale.value}
    })
    sent.value = true
  } catch {
    submitError.value = t('support.sendError', {email: supportEmail})
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto p-4 md:p-8 flex flex-col gap-8">
    <UBreadcrumb
      :items="[{label: t('nav.home'), to: '/'}, {label: t('support.breadcrumb'), to: '/support'}, {label: topicTitle}]"
    />

    <header class="flex flex-col gap-3">
      <div class="flex items-center gap-3">
        <UIcon :name="topic.icon" class="text-4xl text-primary" />
        <h1 class="text-4xl font-bold">{{ topicTitle }}</h1>
      </div>
      <p class="text-lg text-slate-300">{{ topicIntro }}</p>
    </header>

    <UCard v-if="sent">
      <div class="flex flex-col items-start gap-4">
        <UIcon name="i-lucide-circle-check" class="text-4xl text-success" />
        <div>
          <h2 class="text-2xl font-semibold">{{ t('support.sent.title') }}</h2>
          <p class="text-slate-300">
            {{ t('support.sent.description', {name: state.name, email: state.email}) }}
          </p>
        </div>
        <UButton to="/support" :label="t('support.backToSupport')" color="neutral" variant="outline" />
      </div>
    </UCard>

    <UCard v-else>
      <UForm :state="state" :validate="validate" class="flex flex-col gap-5" @submit="onSubmit">
        <UFormField name="reason" :label="t('support.form.reason')" required>
          <USelect v-model="state.reason" :items="reasonItems" class="w-full" />
        </UFormField>

        <UFormField
          name="orderNumber"
          :label="t('support.form.orderNumber')"
          :required="topic.orderNumberRequired"
          :hint="topic.orderNumberRequired ? undefined : t('support.form.optional')"
        >
          <UInput v-model="state.orderNumber" :maxlength="supportLimits.orderNumber" class="w-full" />
        </UFormField>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <UFormField name="name" :label="t('support.form.name')" required>
            <UInput v-model="state.name" autocomplete="name" :maxlength="supportLimits.name" class="w-full" />
          </UFormField>

          <UFormField name="email" :label="t('support.form.email')" required>
            <UInput
              v-model="state.email"
              type="email"
              autocomplete="email"
              :maxlength="supportLimits.email"
              class="w-full"
            />
          </UFormField>
        </div>

        <UFormField name="message" :label="t('support.form.message')" required>
          <UTextarea
            v-model="state.message"
            :rows="6"
            :maxlength="supportLimits.message"
            :placeholder="topicMessagePlaceholder"
            class="w-full"
          />
        </UFormField>

        <!-- Honeypot -->
        <div class="hidden" aria-hidden="true">
          <label
            >{{ t('support.form.honeypotLabel') }}
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
          <UButton type="submit" :label="t('support.form.send')" icon="i-lucide-send" size="lg" :loading="submitting" />
          <UButton to="/support" :label="t('support.form.cancel')" color="neutral" variant="ghost" size="lg" />
        </div>
      </UForm>
    </UCard>
  </div>
</template>
