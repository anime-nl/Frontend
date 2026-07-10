<script setup lang="ts">
const props = defineProps(['product'])
</script>

<template>
  <div class="min-w-64 h-full rounded-2xl snap-center">
    <div class="text-white relative h-full group overflow-hidden rounded-2xl">
      <img alt="product-image" :src=props.product.thumbnail class="object-cover absolute w-full h-full bottom-0 top-0 -z-10" />

      <div class="bg-black/70 bottom-0 absolute w-full p-6 rounded-b-2xl translate-y-full group-hover:translate-y-0 transition-all duration-150 ease-in-out">
        <div class="mb-2">
          <p><b>{{props.product.title}}</b></p>
        </div>

        <hr />

        <p>{{props.product.variants[0].prices[0].amount.toFixed(2)}} {{props.product.variants[0].prices[0].currency_code.toUpperCase()}}</p>
      </div>
    </div>
  </div>
</template>