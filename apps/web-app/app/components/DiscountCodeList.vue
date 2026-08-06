<template>
  <div class="flex flex-col gap-4">
    <h3 class="text-lg font-medium text-muted">
      {{ $dict('account.discount-codes-title') }}
    </h3>

    <p v-if="!codes?.length" class="text-sm text-muted">
      {{ $dict('account.no-discount-codes') }}
    </p>

    <div v-else class="flex flex-col gap-2.5">
      <div
        v-for="code in codes"
        :key="code.code"
        class="flex flex-row flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3"
        :class="code.status === 'active'
          ? 'border-secondary/40 bg-secondary/10'
          : 'border-default opacity-60'"
      >
        <div class="flex flex-col gap-0.5">
          <span
            class="font-mono text-base font-medium tracking-wide"
            :class="code.status === 'active' ? 'text-secondary' : 'text-dimmed line-through'"
          >
            {{ code.code }}
          </span>
          <span class="text-xs text-muted">
            <template v-if="code.status === 'redeemed'">
              {{ $dict('account.discount-code-redeemed') }}
            </template>
            <template v-else-if="code.status === 'expired'">
              {{ $dict('account.discount-code-expired') }}
            </template>
            <template v-else>
              {{ code.discountPercent }} % · ab {{ code.minOrderValue }} € ·
              {{ $dict('account.discount-code-valid-until', { date: datum(code.expiresAt) }) }}
            </template>
          </span>
        </div>

        <UButton
          v-if="code.status === 'active'"
          size="sm"
          variant="soft"
          color="neutral"
          :icon="kopiert === code.code ? 'i-lucide-check' : 'i-lucide-copy'"
          :label="kopiert === code.code
            ? $dict('account.discount-code-copied')
            : $dict('account.discount-code-copy')"
          @click="kopieren(code.code)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Gutschein {
  code: string
  discountPercent: number
  minOrderValue: number
  expiresAt: string
  redeemedAt: string | null
  status: 'active' | 'redeemed' | 'expired'
}

const { data: codes } = await useFetch<Gutschein[]>('/api/discount/me')

const kopiert = ref('')

function datum(wert: string): string {
  return new Date(wert).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

async function kopieren(code: string) {
  try {
    await navigator.clipboard.writeText(code)
    kopiert.value = code
    setTimeout(() => {
      if (kopiert.value === code) {
        kopiert.value = ''
      }
    }, 2000)
  } catch {
    // Zwischenablage nicht verfügbar — der Code steht ja lesbar da
  }
}
</script>
