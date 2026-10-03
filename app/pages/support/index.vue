<script lang="ts" setup>
import type {AccordionItem} from '@nuxt/ui'
import {supportTopics} from '#shared/utils/support'

const {t} = useI18n()

useSeoMeta({
  title: t('support.breadcrumb'),
  description: t('support.overview.description')
})

const {supportEmail} = useRuntimeConfig().public

const faq = computed<AccordionItem[]>(() =>
  [1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => ({
    label: t(`support.faq.${n}.question`),
    content: t(`support.faq.${n}.answer`)
  }))
)
</script>

<template>
  <div class="max-w-4xl mx-auto p-4 md:p-8 flex flex-col gap-12">
    <UBreadcrumb :items="[{label: t('nav.home'), to: '/'}, {label: t('support.breadcrumb')}]" />

    <header class="flex flex-col gap-3">
      <h1 class="text-4xl font-bold">{{ t('support.breadcrumb') }}</h1>
      <p class="text-lg text-slate-300">{{ t('support.overview.subtitle') }}</p>
    </header>

    <section class="flex flex-col gap-4">
      <h2 class="text-2xl font-semibold">{{ t('support.overview.topicsHeading') }}</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <UPageCard
          v-for="topic in supportTopics"
          :key="topic.slug"
          :to="`/support/${topic.slug}`"
          :icon="topic.icon"
          :title="t(`support.topics.${topic.slug}.title`)"
          :description="t(`support.topics.${topic.slug}.description`)"
        />
      </div>
    </section>

    <section class="flex flex-col gap-4">
      <h2 class="text-2xl font-semibold">{{ t('support.overview.faqHeading') }}</h2>
      <UAccordion :items="faq" type="multiple" />
    </section>

    <section>
      <UCard>
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div class="flex flex-col gap-1">
            <h2 class="text-2xl font-semibold">{{ t('support.overview.stillNeedHelp') }}</h2>
            <p class="text-slate-300">{{ t('support.overview.includeOrderNumber') }}</p>
          </div>
          <div class="flex flex-wrap gap-3 shrink-0">
            <UButton
              :to="`mailto:${supportEmail}`"
              icon="i-lucide-mail"
              :label="t('support.overview.emailUs')"
              size="lg"
            />
            <UButton
              to="https://www.trustpilot.com/review/animenl.nl"
              target="_blank"
              icon="i-simple-icons-trustpilot"
              label="Trustpilot"
              color="neutral"
              variant="outline"
              size="lg"
            />
          </div>
        </div>
      </UCard>
    </section>
  </div>
</template>
