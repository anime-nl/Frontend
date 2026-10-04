<script lang="ts" setup>
import type {StoreProduct} from '@medusajs/types'

const {t} = useI18n()
useSeoMeta({title: t('search.pageTitle'), description: t('search.pageDescription')})

interface Collection {
  id: string
  title: string
}

interface ProductFilters {
  q: string
  category: string
  collection: string
}

const availableCollections = ref<Collection[]>([])
const products = ref<StoreProduct[]>([])

const loading = ref(false)
const hasMore = ref(true)
const page = ref(1)
const LIMIT = 12

const route = useRoute()
const queryParam = (key: keyof ProductFilters) => {
  const value = route.query[key]
  return (Array.isArray(value) ? value[0] : value) ?? ''
}

const [{data: categoriesResponse}, {data: regionId}] = await Promise.all([
  useFetch<{product_categories: SearchCategory[]}>('/api/categories'),
  useDefaultRegionId()
])
const availableCategories = computed(() => categoriesResponse.value?.product_categories ?? [])

const filters = reactive<ProductFilters>({
  q: queryParam('q'),
  category: findCategoryId(availableCategories.value, queryParam('category')),
  collection: queryParam('collection')
})

const loadMoreSentinel = useTemplateRef<HTMLElement>('loadMoreSentinel')
const collectionSelect = useTemplateRef<HTMLSelectElement>('collectionSelect')
const infiniteScroll = useInfiniteScroll(
  loadMoreSentinel,
  () => {
    if (hasMore.value && !loading.value) fetchProducts()
  },
  {rootMargin: '200px'}
)
let filterTimeout: ReturnType<typeof setTimeout> | null = null
let currentRequestId = 0

const fetchProducts = async (reset = false) => {
  if (!reset && (loading.value || !hasMore.value)) return

  const requestId = ++currentRequestId
  loading.value = true

  if (reset) {
    page.value = 1
    products.value = []
    hasMore.value = true
  }

  try {
    const queryParams: Record<string, unknown> = {
      limit: LIMIT,
      offset: (page.value - 1) * LIMIT,
      fields: '+variants,*variants.calculated_price',
      region_id: regionId.value
    }

    if (filters.q.trim()) queryParams.q = filters.q.trim()
    if (filters.category) queryParams.category_id = [filters.category]
    if (filters.collection) queryParams.collection_id = [filters.collection]

    const response = await fetchProductPage(queryParams)

    if (requestId !== currentRequestId) return

    products.value.push(...response.products)
    hasMore.value = products.value.length < response.count
    page.value++
  } catch (error) {
    console.error('Failed to fetch products:', error)
  } finally {
    if (requestId === currentRequestId) {
      loading.value = false
      await nextTick()
      infiniteScroll.rearm()
    }
  }
}

const resetFilters = () => {
  filters.q = ''
  filters.category = ''
  filters.collection = ''
}

watch(
  filters,
  () => {
    if (filterTimeout) clearTimeout(filterTimeout)
    filterTimeout = setTimeout(() => {
      fetchProducts(true)
    }, 400)
  },
  {deep: true}
)

onMounted(async () => {
  if (route.query.focus === 'collection') {
    collectionSelect.value?.focus()
  }

  availableCollections.value = await fetchCollections().catch(() => [])

  if (regionId.value) {
    await fetchProducts(true)
    infiniteScroll.start()
  }
})

onUnmounted(() => {
  if (filterTimeout) clearTimeout(filterTimeout)
})
</script>

<template>
  <div class="max-w-screen-2xl mx-auto p-4 md:p-8 flex flex-col md:flex-row gap-8">
    <aside class="w-full md:w-72 shrink-0">
      <UCard class="sticky top-8">
        <div class="space-y-6">
          <div>
            <label for="search-input" class="block text-xl font-bold mb-3">{{ t('search.heading') }}</label>
            <UInput
              id="search-input"
              v-model="filters.q"
              type="text"
              :placeholder="t('search.inputPlaceholder')"
              class="w-full"
            />
          </div>

          <div>
            <label for="collection-select" class="block font-semibold mb-2 text-secondary">{{
              t('search.collectionLabel')
            }}</label>
            <select
              id="collection-select"
              ref="collectionSelect"
              v-model="filters.collection"
              class="w-full bg-transparent border border-sky-200/40 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary hover:border-primary transition-colors"
            >
              <option value="">{{ t('search.allCollections') }}</option>
              <option v-for="col in availableCollections" :key="col.id" :value="col.id">
                {{ col.title }}
              </option>
            </select>
          </div>

          <div>
            <label for="category-select" class="block font-semibold mb-2 text-secondary">{{
              t('search.categoryLabel')
            }}</label>
            <select
              id="category-select"
              v-model="filters.category"
              class="w-full bg-transparent border border-sky-200/40 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary hover:border-primary transition-colors"
            >
              <option value="">{{ t('search.allCategories') }}</option>
              <option v-for="cat in availableCategories" :key="cat.id" :value="cat.id">
                {{ cat.name }}
              </option>
            </select>
          </div>
        </div>
      </UCard>
    </aside>

    <main class="flex-1">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <ProductCard v-for="product in products" :key="product.id" :product="product" class="h-100" />
      </div>

      <div v-if="!loading && products.length === 0" class="text-center py-20 text-slate-400">
        <p class="text-lg">{{ t('search.noResults') }}</p>
        <UButton :label="t('search.clearFilters')" color="primary" variant="link" class="mt-4" @click="resetFilters" />
      </div>

      <div ref="loadMoreSentinel" class="w-full py-12 flex justify-center items-center">
        <div v-if="loading" class="flex flex-col items-center gap-3 text-slate-400">
          <UIcon name="i-lucide-loader-2" class="animate-spin text-primary size-8" />
          <span class="text-sm font-medium text-secondary">{{ t('search.loadingMore') }}</span>
        </div>
        <div v-else-if="!hasMore && products.length > 0" class="text-slate-400 text-sm">
          {{ t('search.endOfCatalog') }}
        </div>
      </div>
    </main>
  </div>
</template>
