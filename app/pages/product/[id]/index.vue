<script setup lang="ts">
const client = useMedusaClient();
const route = useRoute()

const {data} = await useAsyncData('products-key', () =>
    client.store.product.retrieve(<string>route.params.id)
)
const product = computed(() => data.value?.product ?? undefined)

let images: string[] = []
if (product.value) {
  images = product.value.images?.map((img) => img.url) || []
}
</script>

<template>
  <div class="m-16">

    <div class="w-full flex flex-col justify-around align-middle" v-if="product == undefined">
      <h1>Unknown Item</h1>
    </div>

    <div v-else class="flex flex-row gap-16 justify-around align-middle">
      <div class="w-1/2">
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
      </div>
      <div class="w-1/2 h-full flex flex-col justify-center align-top">
        <h1 class="text-4xl font-extrabold">{{ product.title }}</h1>
        <p class="text-xl font-light">{{ product.subtitle }}</p>
      </div>
    </div>
  </div>
</template>