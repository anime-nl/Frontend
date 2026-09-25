<script lang="ts" setup>
import { ref, reactive, watch, onMounted, onUnmounted, useTemplateRef } from 'vue'
import type {StoreProduct} from "@medusajs/types"

interface Category {
  id: string
  name: string
}

interface Collection {
  id: string
  title: string
}

interface ProductFilters {
  q: string
  category: string
  collection: string
}

const currentRegionId = ref<string>('')
const availableCollections = ref<Collection[]>([])
const availableCategories = ref<Category[]>([])
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

const filters = reactive<ProductFilters>({
  q: queryParam('q'),
  category: queryParam('category'),
  collection: queryParam('collection'),
})

const loadMoreSentinel = useTemplateRef<HTMLElement>('loadMoreSentinel')
let observer: IntersectionObserver | null = null
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
    const queryParams: Record<string, any> = {
      limit: LIMIT,
      offset: (page.value - 1) * LIMIT,
      fields: '+variants,+variants.prices',
      region_id: currentRegionId.value,
    }

    if (filters.q.trim()) queryParams.q = filters.q.trim()
    if (filters.category) queryParams.category_id = [filters.category]
    if (filters.collection) queryParams.collection_id = [filters.collection]

    const response: any = await $fetch('/api/products', {
      query: queryParams
    })

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
      rearmObserver()
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
    { deep: true }
)

const rearmObserver = () => {
  if (!observer || !loadMoreSentinel.value) return
  observer.unobserve(loadMoreSentinel.value)
  observer.observe(loadMoreSentinel.value)
}

const setupIntersectionObserver = () => {
  if (!loadMoreSentinel.value) return

  observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0]
        if (target?.isIntersecting && hasMore.value && !loading.value) {
          fetchProducts()
        }
      },
      { rootMargin: '200px' }
  )

  observer.observe(loadMoreSentinel.value)
}

onMounted(async () => {
  const [categoriesRes, collectionsRes, regionsRes] = await Promise.allSettled([
    $fetch('/api/categories'),
    $fetch('/api/collections'),
    $fetch('/api/regions'),
  ])

  if (categoriesRes.status === 'fulfilled') {
    availableCategories.value = (categoriesRes.value as any).product_categories || []
  }
  if (collectionsRes.status === 'fulfilled') {
    availableCollections.value = (collectionsRes.value as any).collections || []
  }
  if (regionsRes.status === 'fulfilled' && (regionsRes.value as any).regions?.length) {
    const firstRegion = (regionsRes.value as any).regions?.[0]
    if (firstRegion) {
      currentRegionId.value = firstRegion.id
      await fetchProducts(true)
      setupIntersectionObserver()
    }
  }
})

onUnmounted(() => {
  if (observer) observer.disconnect()
  if (filterTimeout) clearTimeout(filterTimeout)
})
</script>

<template>
  <div class="max-w-screen-2xl mx-auto p-4 md:p-8 flex flex-col md:flex-row gap-8 bg-slate-900 min-h-screen text-slate-100">

    <aside class="w-full md:w-72 shrink-0">
      <div class="sticky top-8 space-y-6 p-6 rounded-2xl border border-sky-200/20 bg-slate-900">

        <div>
          <label for="search-input" class="block text-xl font-bold mb-3">Search</label>
          <input
              id="search-input"
              v-model="filters.q"
              type="text"
              placeholder="Search products..."
              class="w-full bg-slate-900 border border-sky-200/40 rounded-xl p-3 text-sm focus:ring-2 hover:ring-sky-400 hover:border-sky-400 outline-none placeholder-slate-400 transition-colors"
          >
        </div>

        <div>
          <label for="collection-select" class="block font-semibold mb-2 text-sky-200">Collection</label>
          <select
              id="collection-select"
              v-model="filters.collection"
              class="w-full bg-slate-900 border border-sky-200/40 rounded-xl p-3 text-sm text-white focus:ring-2 hover:ring-sky-400 outline-none transition-colors"
          >
            <option value="">All Collections</option>
            <option v-for="col in availableCollections" :key="col.id" :value="col.id">
              {{ col.title }}
            </option>
          </select>
        </div>

        <div>
          <label for="category-select" class="block font-semibold mb-2 text-sky-200">Category</label>
          <select
              id="category-select"
              v-model="filters.category"
              class="w-full bg-slate-900 border border-sky-200/40 rounded-xl p-3 text-sm text-white focus:ring-2 hover:ring-sky-400 outline-none transition-colors"
          >
            <option value="">All Categories</option>
            <option v-for="cat in availableCategories" :key="cat.id" :value="cat.id">
              {{ cat.name }}
            </option>
          </select>
        </div>

      </div>
    </aside>

    <main class="flex-1">

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <ProductCard
            v-for="product in products"
            :key="product.id"
            :product="product"
            class="h-100"
        />
      </div>

      <div v-if="!loading && products.length === 0" class="text-center py-20 text-slate-400">
        <p class="text-lg">No products found matching your criteria.</p>
        <button
            @click="resetFilters"
            class="mt-4 text-sky-400 hover:text-sky-200 underline transition-colors focus:outline-none"
        >
          Clear filters
        </button>
      </div>

      <div ref="loadMoreSentinel" class="w-full py-12 flex justify-center items-center">
        <div v-if="loading" class="flex flex-col items-center gap-3 text-slate-400">
          <svg class="animate-spin h-8 w-8 text-sky-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span class="text-sm font-medium text-sky-200">Loading more products...</span>
        </div>
        <div v-else-if="!hasMore && products.length > 0" class="text-sky-200/60 text-sm">
          You've reached the end of the catalog.
        </div>
      </div>

    </main>
  </div>
</template>