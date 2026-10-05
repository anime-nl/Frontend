<script lang="ts" setup>
import type {StoreProduct} from '@medusajs/types'
import {discoveryWindow, pickUnseenProducts, rememberShown, shuffle} from '#shared/utils/discovery'

const BATCH_SIZE = 24
const MAX_ATTEMPTS = 5
const FIELDS = 'title,thumbnail,*variants.calculated_price'

const {t} = useI18n()
const {data: regionId} = await useDefaultRegionId()

/**
 * Fetches a page of products at a random offset, so each batch comes from a different part of the catalog.
 * @param totalCount The number of products in the catalog, when already known
 * @returns The fetched products and the catalog's total count
 */
async function fetchRandomPage(totalCount?: number) {
  const count = totalCount ?? (await fetchProductPage({limit: 1, offset: 0, region_id: regionId.value})).count
  if (count === 0) return {products: [], count}

  const limit = Math.min(BATCH_SIZE, count)
  const offset = Math.floor(Math.random() * (count - limit + 1))
  const response = await fetchProductPage({limit, offset, fields: FIELDS, region_id: regionId.value})
  return {products: response.products, count: response.count}
}

const {data: initial} = await useAsyncData('random-products-initial', async () => {
  const page = await fetchRandomPage()
  return {products: shuffle(page.products), count: page.count}
})

const products = ref<StoreProduct[]>(initial.value?.products ?? [])
const totalCount = ref(initial.value?.count ?? 0)
const recentIds = ref<string[]>(rememberShown([], products.value, discoveryWindow(totalCount.value)))
const loading = ref(false)

const loadMoreSentinel = useTemplateRef<HTMLElement>('loadMoreSentinel')
const infiniteScroll = useInfiniteScroll(loadMoreSentinel, loadMore, {rootMargin: '400px'})

/** Loads a batch of products that were not shown within the last DISCOVERY_MEMORY products. */
async function loadMore() {
  if (loading.value || totalCount.value === 0) return
  loading.value = true

  try {
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const page = await fetchRandomPage(totalCount.value)
      const fresh = pickUnseenProducts(page.products, recentIds.value)
      if (fresh.length === 0) continue

      products.value.push(...fresh)
      recentIds.value = rememberShown(recentIds.value, fresh, discoveryWindow(totalCount.value))
      break
    }
  } finally {
    loading.value = false
    await nextTick()
    infiniteScroll.rearm()
  }
}

onMounted(() => infiniteScroll.start())
</script>

<template>
  <div v-if="products.length" class="max-w-screen-2xl mx-auto p-4 md:p-8">
    <h1 class="mx-6 my-2 text-4xl">{{ t('home.discover') }}</h1>
    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
      <ProductCard
        v-for="(product, index) in products"
        :key="`${product.id}-${index}`"
        :product="product"
        class="h-64"
      />
    </div>
    <div ref="loadMoreSentinel" class="w-full py-12 flex justify-center">
      <span v-if="loading" class="text-slate-400 text-sm">{{ t('home.loadingMore') }}</span>
    </div>
  </div>
</template>
