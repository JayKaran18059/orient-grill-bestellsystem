<template>
  <MaintenanceMessage v-if="channelStore.isOnMaintenance" />

  <div class="md:mt-2" />

  <CategoryBlock
    v-for="(category, index) in menuStore.categories"
    :key="category.id"
    :category="category"
    :is-first="index === 0"
  />

  <section class="mt-16 md:mt-20 mb-10 max-w-2xl border-t border-default pt-10 md:pt-12">
    <div class="mb-4 h-px w-12 bg-(--gold-500)" />
    <h1 class="font-serif mb-3 text-3xl md:text-4xl font-semibold">
      {{ optionsStore.getLocaleValue(channelStore.title) }}
    </h1>
    <p class="text-muted leading-relaxed">
      {{ optionsStore.getLocaleValue(channelStore.description) }}
    </p>
  </section>
</template>

<script setup lang="ts">
const optionsStore = useOptionsStore()
const channelStore = useChannelStore()
const menuStore = useMenuStore()

useHead({
  title: optionsStore.getLocaleValue(channelStore.title),
  meta: [
    {
      name: 'description',
      content: optionsStore.getLocaleValue(channelStore.description),
    },
  ],
})
</script>
