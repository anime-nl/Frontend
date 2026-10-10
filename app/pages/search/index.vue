<script lang="ts" setup>
import type {StoreProduct, StoreProductCategory} from '@medusajs/types'
import type {ProductSort} from '#shared/utils/productFilters'

const {t} = useI18n()
useSeoMeta({title: t('search.pageTitle'), description: t('search.pageDescription')})

interface Collection {
  id: string
  title: string
}

const ADDED_WITHIN_OPTIONS = [
  {days: '', label: 'search.addedAny'},
  {days: '7', label: 'search.added7'},
  {days: '30', label: 'search.added30'},
  {days: '90', label: 'search.added90'}
]
const SORT_OPTIONS: {value: ProductSort | ''; label: string}[] = [
  {value: '', label: 'search.sortDefault'},
  {value: 'newest', label: 'search.sortNewest'},
  {value: 'title', label: 'search.sortTitle'},
  {value: 'price_asc', label: 'search.sortPriceAsc'},
  {value: 'price_desc', label: 'search.sortPriceDesc'}
]
const SELECT_CLASSES =
  'w-full bg-default border border-sky-200/40 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary hover:border-primary transition-colors'
const availableCollections = ref<Collection[]>([])
const products = ref<StoreProduct[]>([])

const loading = ref(false)
const hasMore = ref(true)
const page = ref(1)
const LIMIT = 12

const route = useRoute()
const router = useRouter()

const [{data: categoriesResponse}, {data: regionId}] = await Promise.all([
  useFetch<{product_categories: StoreProductCategory[]}>('/api/categories'),
  useDefaultRegionId()
])
const availableCategories = computed(() => categoriesResponse.value?.product_categories ?? [])
const categoryChoices = computed(() => categoryOptions(availableCategories.value))

const filters = reactive<SearchFilters>(queryToFilters(route.query, availableCategories.value))

/** @returns The URL query that describes the current filters */
const currentQuery = () => filtersToQuery(filters, availableCategories.value)

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
    if (filters.category) queryParams.category_id = withDescendantIds(availableCategories.value, filters.category)
    if (filters.collection) queryParams.collection_id = [filters.collection]
    if (filters.minPrice) queryParams.min_price = filters.minPrice
    if (filters.maxPrice) queryParams.max_price = filters.maxPrice
    if (filters.addedWithinDays) queryParams['created_at[$gte]'] = daysAgoIso(Number(filters.addedWithinDays))
    if (filters.inStock) queryParams.in_stock = true
    if (filters.onSale) queryParams.on_sale = true
    if (filters.sort) queryParams.sort = filters.sort

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

/** Shows the filters of a search link that was followed while already on this page. */
const applyRouteQuery = () => {
  if (route.query.focus === 'collection') collectionSelect.value?.focus()

  const routeFilters = queryToFilters(route.query, availableCategories.value)
  // Our own URL updates come back through here; applying them again would only churn the inputs
  if (JSON.stringify(filtersToQuery(routeFilters, availableCategories.value)) === JSON.stringify(currentQuery())) return
  Object.assign(filters, routeFilters)
}

const resetFilters = () => {
  Object.assign(filters, EMPTY_FILTERS)
}

watch(
  filters,
  () => {
    if (filterTimeout) clearTimeout(filterTimeout)
    filterTimeout = setTimeout(() => {
      // replace, not push: every keystroke would otherwise add a history entry to click back through
      router.replace({query: currentQuery()})
      fetchProducts(true)
    }, 400)
  },
  {deep: true}
)

// The navbar's search bar and "by series" links navigate to /search while already on it, which reuses this page.
watch(() => route.query, applyRouteQuery)

onMounted(async () => {
  if (route.query.focus === 'collection') {
    collectionSelect.value?.focus()
  }

  const collectionsLoaded = fetchCollections()
    .catch(() => [])
    .then((collections) => (availableCollections.value = collections))

  if (regionId.value) {
    await fetchProducts(true)
    infiniteScroll.start()
  }
  await collectionsLoaded
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
            <select id="collection-select" ref="collectionSelect" v-model="filters.collection" :class="SELECT_CLASSES">
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
            <select id="category-select" v-model="filters.category" :class="SELECT_CLASSES">
              <option value="">{{ t('search.allCategories') }}</option>
              <option v-for="cat in categoryChoices" :key="cat.id" :value="cat.id">
                {{ cat.label }}
              </option>
            </select>
          </div>

          <div>
            <span class="block font-semibold mb-2 text-secondary">{{ t('search.priceLabel') }}</span>
            <div class="flex items-center gap-2">
              <UInput
                id="min-price-input"
                v-model="filters.minPrice"
                type="number"
                min="0"
                step="0.01"
                :placeholder="t('search.minPriceLabel')"
                :aria-label="t('search.minPriceLabel')"
                class="w-full"
              />
              <span aria-hidden="true">-</span>
              <UInput
                id="max-price-input"
                v-model="filters.maxPrice"
                type="number"
                min="0"
                step="0.01"
                :placeholder="t('search.maxPriceLabel')"
                :aria-label="t('search.maxPriceLabel')"
                class="w-full"
              />
            </div>
          </div>

          <div>
            <label for="added-select" class="block font-semibold mb-2 text-secondary">{{
              t('search.addedLabel')
            }}</label>
            <select id="added-select" v-model="filters.addedWithinDays" :class="SELECT_CLASSES">
              <option v-for="option in ADDED_WITHIN_OPTIONS" :key="option.days" :value="option.days">
                {{ t(option.label) }}
              </option>
            </select>
          </div>

          <fieldset class="space-y-3">
            <legend class="block font-semibold mb-2 text-secondary">{{ t('search.availabilityLabel') }}</legend>
            <UCheckbox id="in-stock-checkbox" v-model="filters.inStock" :label="t('search.inStock')" />
            <UCheckbox id="on-sale-checkbox" v-model="filters.onSale" :label="t('search.onSale')" />
          </fieldset>

          <div>
            <label for="sort-select" class="block font-semibold mb-2 text-secondary">{{ t('search.sortLabel') }}</label>
            <select id="sort-select" v-model="filters.sort" :class="SELECT_CLASSES">
              <option v-for="option in SORT_OPTIONS" :key="option.value" :value="option.value">
                {{ t(option.label) }}
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
