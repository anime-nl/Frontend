<script setup lang="ts">
const route = useRoute()
const customer = useCustomer()

const {error} = await useFetch(`/api/auth/${route.params.provider}/callback`, {method: 'POST', body: route.query})

if (!error.value) {
  await customer.refresh()
  await navigateTo('/account')
}
</script>

<template>
  <UContainer v-if="error" class="flex flex-col items-center gap-6 py-16 text-center">
    <p>Something went wrong signing you in.</p>
    <UButton to="/account/login">Try again</UButton>
  </UContainer>
</template>
