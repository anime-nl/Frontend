<script lang="ts" setup>
import type {StoreProduct} from '@medusajs/types'

const BATCH_SIZE = 24

const {t} = useI18n()
const {data: regionId} = await useDefaultRegionId()

const {data: initial} = await useProductSearch(
  {limit: BATCH_SIZE, offset: 0, fields: 'title,thumbnail,*variants.calculated_price', region_id: regionId},
  'random-products-initial'
)

const products = ref<StoreProduct[]>(initial.value?.products ?? [])
const totalCount = ref(initial.value?.count ?? 0)
const loading = ref(false)

const loadMoreSentinel = useTemplateRef<HTMLElement>('loadMoreSentinel')
let observer: IntersectionObserver | null = null

/** A random offset for a batch, so repeated loads surface different products instead of always the same page. */
function randomOffset() {
  const limit = Math.min(BATCH_SIZE, totalCount.value)
  const maxOffset = Math.max(totalCount.value - limit, 0)
  return Math.floor(Math.random() * (maxOffset + 1))
}

async function loadMore() {
  if (loading.value || totalCount.value === 0) return
  loading.value = true

  try {
    const response = await fetchProductPage({
      limit: Math.min(BATCH_SIZE, totalCount.value),
      offset: randomOffset(),
      fields: 'title,thumbnail,*variants.calculated_price',
      region_id: regionId.value
    })
    products.value.push(...response.products)
  } finally {
    loading.value = false
    await nextTick()
    rearmObserver()
  }
}

function rearmObserver() {
  if (!observer || !loadMoreSentinel.value) return
  observer.unobserve(loadMoreSentinel.value)
  observer.observe(loadMoreSentinel.value)
}

onMounted(() => {
  if (!loadMoreSentinel.value) return

  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0]?.isIntersecting) loadMore()
    },
    {rootMargin: '400px'}
  )
  observer.observe(loadMoreSentinel.value)
})

onUnmounted(() => {
  observer?.disconnect()
})
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
