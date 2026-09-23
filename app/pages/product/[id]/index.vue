<script setup lang="ts">
const client = useMedusaClient();
const route = useRoute()

const { data, error } = await useAsyncData(
    `product-key`,
    async () => {
      console.log("Fetching product:", route.params.id)

      return await client.store.product.retrieve(
          route.params.id as string
      )
    }
)

console.log("Response:", data.value)
console.log("Error:", error.value)

const product = computed(() => data.value?.product)

if (!product.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Product not found'
  })
}

const images = computed(() =>
    product.value?.images?.map(img => img.url) ?? []
)
</script>

<template>
  <div class="m-16">

    <div class="w-full flex flex-col justify-around align-middle" v-if="!product">
      <h1>Unknown Item</h1>
    </div>

    <div v-else class="flex flex-row gap-16 justify-around align-middle">
      <div class="w-1/2">
        <ClientOnly>
          <UCarousel
              v-slot="{ item }"
              :autoplay="{ delay: 5000 }"
              :items="images"
              :ui="{ item: 'h-1/2 my-auto' }"
              arrows
              dots
              loop
          >
            <img :src="item" alt="showcase" class="rounded-4xl mx-auto my-auto max-h-256 object-contain" loading="lazy">
          </UCarousel>
        </ClientOnly>
      </div>
      <div class="w-1/2 h-full flex flex-col justify-center align-top">
        <h1 class="text-4xl font-extrabold">{{ product.title }}</h1>
        <p class="text-xl font-light">{{ product.description }}</p>
      </div>
    </div>
  </div>
</template>