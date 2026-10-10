<script lang="ts" setup>
import type {StoreProduct} from '@medusajs/types'

const props = defineProps<{
  handle: string
  badge?: string
  title: string
  description?: string
}>()

const {t} = useI18n()
const {data} = await useCategoryProducts(props.handle)
const products = ref<StoreProduct[]>(data.value?.products ?? [])
const loading = ref(false)
const hasMore = computed(() => products.value.length < (data.value?.count ?? 0))

const loadMoreSentinel = useTemplateRef<HTMLElement>('loadMoreSentinel')
const infiniteScroll = useInfiniteScroll(loadMoreSentinel, loadMore, {rootMargin: '400px'})

/** Appends the next page of the category's products, unless one is already loading or all are shown. */
async function loadMore() {
  if (loading.value || !hasMore.value || !data.value) return
  loading.value = true

  try {
    const response = await fetchProductPage({...data.value.query, offset: products.value.length})
    products.value.push(...response.products)
  } finally {
    loading.value = false
    await nextTick()
    infiniteScroll.rearm()
  }
}

onMounted(() => infiniteScroll.start())
</script>

<template>
  <UContainer class="flex flex-col gap-8">
    <ProductPageHeader :badge="badge" :title="title" :description="description" />
    <UPageColumns v-if="products.length">
      <ProductCard v-for="product in products" :key="product.id" :product="product" class="h-100" />
    </UPageColumns>
    <p v-else class="text-center text-slate-400 py-12">{{ t('products.emptyCategory') }}</p>
    <div ref="loadMoreSentinel" class="w-full py-12 flex justify-center">
      <span v-if="loading" class="text-slate-400 text-sm">{{ t('home.loadingMore') }}</span>
    </div>
  </UContainer>
</template>
