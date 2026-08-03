<template>
  <div class="px-4 lg:px-6 xl:px-8 my-20 flex flex-col gap-3.5">
    <UNavigationMenu
      variant="link"
      orientation="vertical"
      :items="footerMenuItems"
      class="w-full -ml-2.5"
    />

    <div class="flex flex-col lg:flex-row gap-2 justify-between lg:items-start">
      <div v-if="channelStore.copyright" class="font-sans text-xs text-muted whitespace-pre-wrap">
        {{ optionsStore.getLocaleValue(channelStore.copyright) }}
      </div>

      <UNavigationMenu
        :items="socialMenuItems"
        :ui="{
          linkLeadingIcon: 'size-8',
        }"
        orientation="horizontal"
        variant="link"
        class="-mx-2.5"
      />
    </div>

    <!-- Der Hinweis auf die verwendete Vorlage stand hier bewusst
         nicht mehr: Die MIT-Lizenz verlangt lediglich, dass der
         Lizenztext im Quellcode erhalten bleibt (siehe LICENSE), nicht
         dass er auf der Seite des Kunden erscheint. -->
  </div>
</template>

<script setup lang="ts">
const optionsStore = useOptionsStore()
const channelStore = useChannelStore()

const footerMenuItems = computed(() => channelStore.links?.footer.map((link) => ({
  label: optionsStore.getLocaleValue(link.label),
  to: link.to,
  icon: link.icon,
  target: link.target,
})))

const socialMenuItems = computed(() => channelStore.links?.social.map((link) => ({
  to: link.to,
  icon: link.icon,
  target: link.target,
  size: 'xl',
})))
</script>
