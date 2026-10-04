<script setup lang="ts">
import type {StoreProduct, StoreProductVariant} from '@medusajs/types'
import {formatCurrency} from '#shared/utils/currency'

const route = useRoute()
const toast = useToast()
const requestUrl = useRequestURL()
const cart = useCart()
const {t, localeProperties} = useI18n()

const {data, error} = await useFetch<{product: StoreProduct; region_id?: string; sales_channel_id?: string}>(
  () => `/api/products/${route.params.id}`,
  {key: `product-${route.params.id}`}
)

if (error.value || !data.value?.product) {
  throw createError({
    statusCode: error.value?.statusCode ?? 404,
    statusMessage: error.value?.statusMessage ?? 'Product not found',
    fatal: true
  })
}

const product = computed(() => data.value!.product)

const images = computed(() => {
  const urls = product.value.images?.map((img) => img.url) ?? []
  if (!urls.length && product.value.thumbnail) urls.push(product.value.thumbnail)
  return urls
})

const variants = computed(() => product.value.variants ?? [])
const options = computed(() => product.value.options ?? [])
const hasOptions = computed(() => variants.value.length > 1)

const isPurchasable = (variant: StoreProductVariant) =>
  !variant.manage_inventory || (variant.inventory_quantity ?? 0) > 0 || !!variant.allow_backorder

const initialVariant = variants.value.find(isPurchasable) ?? variants.value[0]

const selectedOptions = ref<Record<string, string>>(
  Object.fromEntries((initialVariant?.options ?? []).map((o) => [o.option_id, o.value]))
)

const selectedVariant = computed<StoreProductVariant | undefined>(
  () =>
    variants.value.find((variant) => variant.options?.every((o) => selectedOptions.value[o.option_id!] === o.value)) ??
    variants.value[0]
)

const quantity = ref(1)

const price = computed(() => {
  const calculated = selectedVariant.value?.calculated_price
  if (!calculated || calculated.calculated_amount == null) return null

  const currency = calculated.currency_code!
  const original = calculated.original_amount ?? calculated.calculated_amount
  return {
    current: formatCurrency(calculated.calculated_amount, currency, localeProperties.value.language!),
    original:
      original > calculated.calculated_amount
        ? formatCurrency(original, currency, localeProperties.value.language!)
        : null
  }
})

const stock = computed(() => {
  const variant = selectedVariant.value
  if (!variant) {
    return {
      label: t('product.stock.unavailable'),
      color: 'error' as const,
      purchasable: false,
      max: 0,
      isBackorder: false
    }
  }

  if (!variant.manage_inventory) {
    return {
      label: t('product.stock.inStock'),
      color: 'success' as const,
      purchasable: true,
      max: undefined,
      isBackorder: false
    }
  }

  const available = variant.inventory_quantity ?? 0
  if (available > 0) {
    return {
      label: t('product.stock.inStockCount', {count: available}),
      color: 'success' as const,
      purchasable: true,
      // A backorderable variant has no maximum, even while stock remains
      max: variant.allow_backorder ? undefined : available,
      isBackorder: false
    }
  }
  if (variant.allow_backorder) {
    return {
      label: t('product.stock.backorder'),
      color: 'warning' as const,
      purchasable: true,
      max: undefined,
      isBackorder: true
    }
  }
  return {label: t('product.stock.outOfStock'), color: 'error' as const, purchasable: false, max: 0, isBackorder: false}
})

watch(selectedVariant, () => {
  quantity.value = 1
})

const details = computed(() => {
  const p = product.value
  const countryNames = new Intl.DisplayNames([localeProperties.value.language!], {type: 'region'})
  const entries: [string, string | number | null | undefined][] = [
    [t('product.details.sku'), selectedVariant.value?.sku],
    [t('product.details.type'), p.type?.value],
    [t('product.details.material'), p.material],
    [t('product.details.origin'), p.origin_country ? countryNames.of(p.origin_country.toUpperCase()) : null],
    [t('product.details.weight'), p.weight ? `${p.weight} g` : null],
    [
      t('product.details.dimensions'),
      p.length && p.width && p.height ? `${p.length} × ${p.width} × ${p.height} mm` : null
    ]
  ]
  return entries.filter((entry): entry is [string, string | number] => entry[1] != null && entry[1] !== '')
})

const breadcrumbs = computed(() => [
  {label: t('nav.home'), to: '/'},
  {label: t('search.heading'), to: '/search'},
  ...(product.value.collection
    ? [
        {
          label: product.value.collection.title,
          to: `/search?collection=${product.value.collection.id}`
        }
      ]
    : []),
  {label: product.value.title}
])

const adding = ref(false)

async function addToCart() {
  if (!selectedVariant.value || !stock.value.purchasable || adding.value) return
  adding.value = true

  try {
    await cart.addItem(selectedVariant.value.id, quantity.value)

    toast.add({
      title: t('product.addedToCartTitle'),
      description: `${quantity.value} × ${product.value.title}`,
      icon: 'i-lucide-shopping-cart',
      color: 'success'
    })
  } catch (e) {
    console.error('Failed to add to cart:', e)
    toast.add({
      title: t('product.addToCartErrorTitle'),
      description: t('product.addToCartErrorDescription'),
      icon: 'i-lucide-circle-alert',
      color: 'error'
    })
  } finally {
    adding.value = false
  }
}

useSeoMeta({
  title: () => product.value.title,
  description: () => product.value.subtitle || product.value.description,
  ogImage: () => images.value[0]
})

const offerAvailability = computed(() => {
  if (!stock.value.purchasable) return 'https://schema.org/OutOfStock'
  return stock.value.isBackorder ? 'https://schema.org/BackOrder' : 'https://schema.org/InStock'
})

const productJsonLd = computed(() => {
  const calculated = selectedVariant.value?.calculated_price

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.value.title,
    description: product.value.description || product.value.subtitle || undefined,
    image: images.value,
    sku: selectedVariant.value?.sku || undefined,
    offers:
      calculated?.calculated_amount == null
        ? undefined
        : {
            '@type': 'Offer',
            price: calculated.calculated_amount,
            priceCurrency: calculated.currency_code!.toUpperCase(),
            availability: offerAvailability.value,
            url: requestUrl.href
          }
  }
})

useHead({
  script: [{key: 'product-ld-json', type: 'application/ld+json', innerHTML: () => JSON.stringify(productJsonLd.value)}]
})
</script>

<template>
  <div class="max-w-screen-2xl mx-auto p-4 md:p-8 flex flex-col gap-8">
    <UBreadcrumb :items="breadcrumbs" />

    <div class="flex flex-col lg:flex-row gap-8 lg:gap-16">
      <div class="w-full lg:w-1/2">
        <ClientOnly>
          <UCarousel
            v-if="images.length > 1"
            v-slot="{item}"
            :autoplay="{delay: 5000}"
            :items="images"
            arrows
            dots
            loop
          >
            <img
              :src="item"
              :alt="product.title"
              class="rounded-4xl w-full h-80 sm:h-120 lg:h-160 object-contain object-center"
              loading="lazy"
            />
          </UCarousel>
          <img
            v-else-if="images.length === 1"
            :src="images[0]"
            :alt="product.title"
            class="rounded-4xl w-full h-80 sm:h-120 lg:h-160 object-contain object-center"
          />
          <template #fallback>
            <img
              v-if="images[0]"
              :src="images[0]"
              :alt="product.title"
              class="rounded-4xl w-full h-80 sm:h-120 lg:h-160 object-contain object-center"
            />
          </template>
        </ClientOnly>
        <div
          v-if="!images.length"
          class="flex items-center justify-center h-80 sm:h-120 lg:h-160 rounded-4xl bg-gray-900 text-slate-400"
        >
          <UIcon name="i-lucide-image-off" class="text-6xl" />
        </div>
      </div>

      <div class="w-full lg:w-1/2 flex flex-col gap-6">
        <div class="flex flex-col gap-2">
          <div v-if="product.collection || product.tags?.length" class="flex flex-wrap gap-2">
            <UBadge v-if="product.collection" :label="product.collection.title" color="primary" variant="subtle" />
            <UBadge v-for="tag in product.tags" :key="tag.id" :label="tag.value" color="neutral" variant="subtle" />
          </div>

          <h1 class="text-4xl font-extrabold">{{ product.title }}</h1>
          <p v-if="product.subtitle" class="text-xl font-light text-secondary">{{ product.subtitle }}</p>
        </div>

        <div class="flex flex-wrap items-center gap-4">
          <template v-if="price">
            <span class="text-3xl font-bold text-primary">{{ price.current }}</span>
            <span v-if="price.original" class="text-xl text-slate-400 line-through">{{ price.original }}</span>
          </template>
          <span v-else class="text-lg text-slate-400">{{ t('products.priceUnavailable') }}</span>
          <UBadge :color="stock.color" :label="stock.label" size="lg" variant="subtle" />
        </div>

        <USeparator />

        <div v-if="hasOptions" class="flex flex-col gap-4">
          <div v-for="option in options" :key="option.id" class="flex flex-col gap-2">
            <span class="font-semibold text-secondary">{{ option.title }}</span>
            <div class="flex flex-wrap gap-2">
              <UButton
                v-for="value in option.values"
                :key="value.id"
                :label="value.value"
                :variant="selectedOptions[option.id] === value.value ? 'solid' : 'outline'"
                color="primary"
                @click="selectedOptions[option.id] = value.value"
              />
            </div>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-4">
          <UInputNumber v-model="quantity" :disabled="!stock.purchasable" :max="stock.max" :min="1" size="xl" />
          <UButton
            :disabled="!stock.purchasable"
            :label="stock.isBackorder ? t('product.backorderNow') : t('product.addToCart')"
            :loading="adding"
            class="flex-1 justify-center"
            icon="i-lucide-shopping-cart"
            size="xl"
            @click="addToCart"
          />
        </div>

        <UAlert
          v-if="stock.isBackorder"
          color="warning"
          :description="t('product.backorderAlertDescription')"
          icon="i-lucide-clock"
          :title="t('product.backorderAlertTitle')"
          variant="subtle"
        />

        <div v-if="product.description" class="flex flex-col gap-2">
          <h2 class="text-2xl font-bold">{{ t('product.descriptionHeading') }}</h2>
          <p class="whitespace-pre-line font-light leading-relaxed">{{ product.description }}</p>
        </div>

        <div v-if="details.length" class="flex flex-col gap-2">
          <h2 class="text-2xl font-bold">{{ t('product.detailsHeading') }}</h2>
          <dl class="grid grid-cols-[max-content_1fr] gap-x-8 gap-y-2 rounded-2xl border border-sky-200/20 p-6">
            <template v-for="[label, value] in details" :key="label">
              <dt class="font-semibold text-secondary">{{ label }}</dt>
              <dd>{{ value }}</dd>
            </template>
          </dl>
        </div>

        <div v-if="product.categories?.length" class="flex flex-wrap items-center gap-2">
          <span class="font-semibold text-secondary">{{ t('product.categoriesLabel') }}</span>
          <UButton
            v-for="category in product.categories"
            :key="category.id"
            :label="category.name"
            :to="`/search?category=${category.id}`"
            color="neutral"
            size="sm"
            variant="soft"
          />
        </div>
      </div>
    </div>
  </div>
</template>
