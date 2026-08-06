<template>
  <div class="flex flex-col gap-2">
    <label class="text-sm text-muted" :for="feldId">
      {{ $dict('account.discount-code-input-label') }}
    </label>

    <div v-if="angewendet" class="flex flex-row items-center justify-between gap-3 rounded-lg border border-secondary/40 bg-secondary/10 px-4 py-3">
      <div class="flex flex-col gap-0.5">
        <span class="font-mono text-sm font-medium tracking-wide text-secondary">
          {{ eingabe.toUpperCase() }}
        </span>
        <span class="text-xs text-muted">
          {{ $dict('account.discount-code-applied', { percent: angewendet.discountPercent }) }}
        </span>
      </div>

      <UButton
        variant="ghost"
        color="neutral"
        size="sm"
        :label="$dict('account.discount-code-remove')"
        @click="entfernen"
      />
    </div>

    <div v-else class="flex flex-row gap-2">
      <UInput
        :id="feldId"
        v-model="eingabe"
        size="xl"
        placeholder="ORIENT-XXXX-XXXX"
        autocapitalize="characters"
        autocomplete="off"
        spellcheck="false"
        class="flex-1 font-mono"
        :disabled="laeuft"
        @keydown.enter.prevent="pruefen"
      />
      <UButton
        size="xl"
        variant="soft"
        color="neutral"
        :loading="laeuft"
        :disabled="!eingabe.trim()"
        :label="$dict('account.discount-code-apply')"
        @click="pruefen"
      />
    </div>

    <p v-if="fehler" class="text-sm text-error">
      {{ fehler }}
    </p>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  /** Warensumme vor Rabatt — entscheidet über den Mindestbestellwert */
  orderTotal: number
}>()

const orderStore = useOrderStore()
const { t: dict } = useI18n()

const feldId = useId()
const eingabe = ref('')
const laeuft = ref(false)
const fehler = ref('')
const angewendet = ref<{ discountPercent: number } | null>(null)

async function pruefen() {
  const code = eingabe.value.trim()
  if (!code) {
    return
  }

  laeuft.value = true
  fehler.value = ''

  try {
    const ergebnis = await $fetch<{
      ok: boolean
      grund?: string
      discountPercent?: number
      minOrderValue?: number
    }>('/api/discount/check', {
      method: 'POST',
      body: { code, orderTotal: props.orderTotal },
    })

    if (ergebnis.ok && ergebnis.discountPercent) {
      angewendet.value = { discountPercent: ergebnis.discountPercent }
      // Erst jetzt in den Bestellvorgang übernehmen. Verbindlich
      // geprüft wird beim Abschluss noch einmal.
      orderStore.discountCode = code.toUpperCase()
      return
    }

    fehler.value = ergebnis.grund === 'mindestwert' && ergebnis.minOrderValue
      ? dict('account.discount-code-min-value', { value: ergebnis.minOrderValue })
      : dict('account.discount-code-invalid')
  } catch {
    fehler.value = dict('account.discount-code-invalid')
  } finally {
    laeuft.value = false
  }
}

function entfernen() {
  angewendet.value = null
  orderStore.discountCode = ''
  eingabe.value = ''
  fehler.value = ''
}

// Ändert sich der Warenkorb, kann der Mindestbestellwert kippen —
// dann muss der Code neu geprüft werden.
watch(() => props.orderTotal, () => {
  if (angewendet.value) {
    pruefen()
  }
})
</script>
