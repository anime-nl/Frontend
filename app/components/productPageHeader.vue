<script lang="ts" setup>
defineProps<{
  badge?: string
  title: string
  description?: string
}>()
</script>

<template>
  <header class="relative w-full overflow-hidden bg-gray-900 rounded-3xl shadow-2xl mb-8">
    <div class="relative px-6 py-16 md:py-24 flex flex-col items-center justify-center text-center">
      <span
        v-if="badge"
        class="inline-block py-1 px-3 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-semibold tracking-widest uppercase text-xs mb-6 shadow-[0_0_15px_rgba(99,102,241,0.2)]"
      >
        {{ badge }}
      </span>

      <h1
        class="text-4xl md:text-6xl font-extrabold bg-clip-text bg-linear-to-r from-gray-100 via-white to-gray-400 drop-shadow-lg mb-6 tracking-tight"
      >
        {{ title }}
      </h1>

      <p v-if="description" class="max-w-2xl text-gray-400 text-lg md:text-xl font-light leading-relaxed">
        {{ description }}
      </p>
    </div>
  </header>
</template>
