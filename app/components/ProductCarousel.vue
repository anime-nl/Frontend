<script setup lang="ts">
const client = useMedusaClient();
const productListRef = ref<HTMLElement | null>(null);

const { data } = await useAsyncData('products-key', () =>
    client.store.product.list({
      fields: "title,thumbnail,variants.prices.*"
    })
)

const products = computed(() => data.value?.products ?? [])

function scroll(amount: number) {

  if (productListRef.value) {
    productListRef.value.scrollLeft += amount
  }
}
</script>

<template>
  <div class="h-full m-4">
    <h1 class="mx-6 my-2 text-5xl">New Products</h1>
    <div class="flex flex-row h-full w-full items-center"> <ClientOnly>
      <UButton @click="scroll(-200)" variant="ghost" class="h-96 w-32 justify-center bg-linear-to-r from-black/50 to-black/20 to-80% cursor-pointer shrink-0" >
        <UIcon name="i-flat-color-icons:previous" class="text-6xl" />
      </UButton>
    </ClientOnly>

      <div ref="productListRef" class="h-128 mx-6 mt-6 pb-6 flex flex-row gap-5 overflow-x-auto snap-x snap-mandatory flex-1 min-w-0 smooth-scroll">
        <ProductCard v-for="product in products" :key="product.id" :product="product" class="snap-center" />
      </div>

      <ClientOnly>
        <UButton @click="scroll(200)" variant="ghost" class="h-96 w-32 justify-center bg-linear-to-l from-black/50 to-black/20 to-80% cursor-pointer z-10 shrink-0" >
          <UIcon name="i-flat-color-icons:next" class="text-6xl" />
        </UButton>
      </ClientOnly>

    </div>
  </div>
</template>

<style scoped>
div[ref="productListRef"], .smooth-scroll {
  scroll-behavior: smooth;
}
</style>