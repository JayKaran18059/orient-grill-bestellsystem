<template>
  <div class="flex flex-col gap-4">
    <h3 class="text-lg font-medium text-muted">
      {{ $dict('account.loyalty-title') }}
    </h3>

    <div class="flex flex-wrap gap-2.5 md:gap-3">
      <div
        v-for="index in stampsPerReward"
        :key="index"
        class="flex size-11 md:size-14 shrink-0 items-center justify-center rounded-full border-2 transition-colors"
        :class="index <= stampCount
          ? 'border-secondary bg-secondary/15 text-secondary motion-preset-pop'
          : 'border-default text-dimmed/40'"
        :style="index <= stampCount ? { transitionDelay: `${(index - 1) * 90}ms` } : undefined"
      >
        <UIcon :name="index <= stampCount ? 'i-lucide-check' : 'i-lucide-circle-dashed'" class="size-5 md:size-6" />
      </div>
    </div>

    <p v-if="rewardAvailable" class="text-sm font-medium text-secondary motion-preset-slide-left-sm">
      {{ $dict('account.loyalty-reward-available') }}
    </p>
    <p v-else class="text-sm text-muted">
      {{ $dict('account.loyalty-next-reward-note') }}
    </p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  stampCount: number
  stampsPerReward: number
  rewardAvailable: boolean
}>()
</script>
