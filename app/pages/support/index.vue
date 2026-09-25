<script lang="ts" setup>
import type {AccordionItem} from '@nuxt/ui'
import {supportTopics} from '#shared/utils/support'

useSeoMeta({
  title: 'Support | AnimeNL',
  description:
    'Find answers to common questions about orders, shipping, returns and products, or get in touch with the AnimeNL team.'
})

const {supportEmail} = useRuntimeConfig().public

const faq: AccordionItem[] = [
  {
    label: 'How long does shipping take?',
    content:
      'Shipping usually takes 2 to 3 days. If your order is taking longer, contact us with your order number and we will look into it.'
  },
  {
    label: 'Which payment methods do you accept?',
    content:
      'We accept all payment methods supported by Mollie, including iDEAL and credit card. You can see the methods available to you at checkout.'
  },
  {
    label: 'What is your return policy?',
    content:
      'You have a 14-day return period, in line with EU consumer rules. Contact us within 14 days of receiving your order to let us know you want to return it.'
  },
  {
    label: 'How do I return an item?',
    content:
      'Contact us within the 14-day return period, so we can tell you how to send the item back and link it to your order.'
  },
  {
    label: 'How can I check the status of my order?',
    content:
      'Contact us and include your order number and the email address you ordered with. We will let you know where your order is.'
  },
  {
    label: 'Can I change or cancel my order?',
    content:
      'Contact us as soon as possible after ordering. Once an order has been packed and shipped it can no longer be changed, but you can still return it within the 14-day return period.'
  },
  {
    label: 'My item arrived damaged or is not what I ordered.',
    content:
      'Send us your order number and a few photos of the item and its packaging, and we will work out a solution with you.'
  },
  {
    label: 'What does "backorder" mean on a product?',
    content:
      'A product on backorder is currently out of stock, but we can still take your order. It will be shipped once it is back in stock.'
  },
  {
    label: 'A product I am looking for is not in the shop.',
    content:
      'Try the search page to look by series, collection or category. If you still cannot find it, let us know and we will see what we can do.'
  }
]
</script>

<template>
  <div class="max-w-4xl mx-auto p-4 md:p-8 flex flex-col gap-12">
    <UBreadcrumb :items="[{label: 'Home', to: '/'}, {label: 'Support'}]" />

    <header class="flex flex-col gap-3">
      <h1 class="text-4xl font-bold">Support</h1>
      <p class="text-lg text-slate-300">
        Need a hand? Find answers to common questions below, or get in touch and we will help you out.
      </p>
    </header>

    <section class="flex flex-col gap-4">
      <h2 class="text-2xl font-semibold">What do you need help with?</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <UPageCard
          v-for="topic in supportTopics"
          :key="topic.slug"
          :to="`/support/${topic.slug}`"
          :icon="topic.icon"
          :title="topic.title"
          :description="topic.description"
        />
      </div>
    </section>

    <section class="flex flex-col gap-4">
      <h2 class="text-2xl font-semibold">Frequently asked questions</h2>
      <UAccordion :items="faq" type="multiple" />
    </section>

    <section>
      <UCard>
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div class="flex flex-col gap-1">
            <h2 class="text-2xl font-semibold">Still need help?</h2>
            <p class="text-slate-300">Include your order number, if you have one, so we can help you faster.</p>
          </div>
          <div class="flex flex-wrap gap-3 shrink-0">
            <UButton :to="`mailto:${supportEmail}`" icon="i-lucide-mail" label="Email us" size="lg" />
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
