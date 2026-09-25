<script setup lang="ts">
import type {StoreProduct, StoreProductVariant} from '@medusajs/types'

const client = useMedusaClient()
const route = useRoute()
const toast = useToast()
const cartId = useCookie<string | null>('cart_id', {maxAge: 60 * 60 * 24 * 30})

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

  const currency = calculated.currency_code!.toUpperCase()
  const format = (amount: number) => new Intl.NumberFormat('nl-NL', {style: 'currency', currency}).format(amount)

  const original = calculated.original_amount ?? calculated.calculated_amount
  return {
    current: format(calculated.calculated_amount),
    original: original > calculated.calculated_amount ? format(original) : null
  }
})

const stock = computed(() => {
  const variant = selectedVariant.value
  if (!variant) return {label: 'Unavailable', color: 'error' as const, purchasable: false, max: 0}

  if (!variant.manage_inventory) {
    return {label: 'In stock', color: 'success' as const, purchasable: true, max: undefined}
  }

  const available = variant.inventory_quantity ?? 0
  if (available > 0) {
    return {label: `${available} in stock`, color: 'success' as const, purchasable: true, max: available}
  }
  if (variant.allow_backorder) {
    return {label: 'Backorder', color: 'warning' as const, purchasable: true, max: undefined}
  }
  return {label: 'Out of stock', color: 'error' as const, purchasable: false, max: 0}
})

watch(selectedVariant, () => {
  quantity.value = 1
})

const countryNames = new Intl.DisplayNames(['en'], {type: 'region'})

const details = computed(() => {
  const p = product.value
  const entries: [string, string | number | null | undefined][] = [
    ['SKU', selectedVariant.value?.sku],
    ['Type', p.type?.value],
    ['Material', p.material],
    ['Origin', p.origin_country ? countryNames.of(p.origin_country.toUpperCase()) : null],
    ['Weight', p.weight ? `${p.weight} g` : null],
    ['Dimensions', p.length && p.width && p.height ? `${p.length} × ${p.width} × ${p.height} mm` : null]
  ]
  return entries.filter((entry): entry is [string, string | number] => entry[1] != null && entry[1] !== '')
})

const breadcrumbs = computed(() => [
  {label: 'Home', to: '/'},
  {label: 'Search', to: '/search'},
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
    if (!cartId.value) {
      const {cart} = await client.store.cart.create({
        region_id: data.value!.region_id,
        sales_channel_id: data.value!.sales_channel_id
      })
      cartId.value = cart.id
    }

    await client.store.cart.createLineItem(cartId.value, {
      variant_id: selectedVariant.value.id,
      quantity: quantity.value
    })

    toast.add({
      title: 'Added to cart',
      description: `${quantity.value} × ${product.value.title}`,
      icon: 'i-lucide-shopping-cart',
      color: 'success'
    })
  } catch (e) {
    console.error('Failed to add to cart:', e)
    toast.add({
      title: 'Could not add to cart',
      description: 'Please try again in a moment.',
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
            <img :src="item" :alt="product.title" class="rounded-4xl mx-auto max-h-160 object-contain" loading="lazy" />
          </UCarousel>
          <img
            v-else-if="images.length === 1"
            :src="images[0]"
            :alt="product.title"
            class="rounded-4xl mx-auto max-h-160 object-contain"
          />
          <template #fallback>
            <img
              v-if="images[0]"
              :src="images[0]"
              :alt="product.title"
              class="rounded-4xl mx-auto max-h-160 object-contain"
            />
          </template>
        </ClientOnly>
        <div v-if="!images.length" class="flex items-center justify-center h-96 rounded-4xl bg-gray-900 text-slate-400">
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
          <span v-else class="text-lg text-slate-400">Price unavailable</span>
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
            :label="stock.label === 'Backorder' ? 'Backorder now' : 'Add to cart'"
            :loading="adding"
            class="flex-1 justify-center"
            icon="i-lucide-shopping-cart"
            size="xl"
            @click="addToCart"
          />
        </div>

        <UAlert
          v-if="stock.label === 'Backorder'"
          color="warning"
          description="This item is currently out of stock. Your order will be shipped as soon as it is back in stock."
          icon="i-lucide-clock"
          title="Available on backorder"
          variant="subtle"
        />

        <div v-if="product.description" class="flex flex-col gap-2">
          <h2 class="text-2xl font-bold">Description</h2>
          <p class="whitespace-pre-line font-light leading-relaxed">{{ product.description }}</p>
        </div>

        <div v-if="details.length" class="flex flex-col gap-2">
          <h2 class="text-2xl font-bold">Details</h2>
          <dl class="grid grid-cols-[max-content_1fr] gap-x-8 gap-y-2 rounded-2xl border border-sky-200/20 p-6">
            <template v-for="[label, value] in details" :key="label">
              <dt class="font-semibold text-secondary">{{ label }}</dt>
              <dd>{{ value }}</dd>
            </template>
          </dl>
        </div>

        <div v-if="product.categories?.length" class="flex flex-wrap items-center gap-2">
          <span class="font-semibold text-secondary">Categories:</span>
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
