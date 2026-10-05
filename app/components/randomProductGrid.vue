<script lang="ts" setup>
import type {StoreProduct} from '@medusajs/types'
import {discoveryWindow, takeBatch} from '#shared/utils/discovery'

const BATCH_SIZE = 24
const MAX_FETCHES = 5
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
  return {products: page.products, count: page.count}
})

const totalCount = ref(initial.value?.count ?? 0)
const pool = new Map((initial.value?.products ?? []).map((product) => [product.id, product]))
const firstBatch = takeBatch([...pool.values()], [], discoveryWindow(totalCount.value), BATCH_SIZE)
const products = ref<StoreProduct[]>(firstBatch.batch)
const recentIds = ref<string[]>(firstBatch.recentIds)
const loading = ref(false)

const loadMoreSentinel = useTemplateRef<HTMLElement>('loadMoreSentinel')
const infiniteScroll = useInfiniteScroll(loadMoreSentinel, loadMore, {rootMargin: '400px'})

/**
 * Fetches random pages into the pool until enough products are eligible for a full batch.
 * Stops when the whole catalog is known, or after MAX_FETCHES, since random pages can overlap.
 */
async function fillPool() {
  const window = discoveryWindow(totalCount.value)
  for (let fetches = 0; fetches < MAX_FETCHES && pool.size < totalCount.value; fetches++) {
    if (takeBatch([...pool.values()], recentIds.value, window, BATCH_SIZE).batch.length === BATCH_SIZE) return

    const page = await fetchRandomPage(totalCount.value)
    page.products.forEach((product) => pool.set(product.id, product))
  }
}

/** Loads a batch of products that were not shown within the last DISCOVERY_MEMORY products. */
async function loadMore() {
  if (loading.value || totalCount.value === 0) return
  loading.value = true

  try {
    await fillPool()
    const next = takeBatch([...pool.values()], recentIds.value, discoveryWindow(totalCount.value), BATCH_SIZE)
    products.value.push(...next.batch)
    recentIds.value = next.recentIds
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
