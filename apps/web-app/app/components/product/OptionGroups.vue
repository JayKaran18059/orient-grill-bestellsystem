<template>
  <div v-if="groups.length" class="flex flex-col gap-6">
    <div v-for="group in groups" :key="group.id">
      <div class="flex flex-row items-baseline justify-between gap-3">
        <h2 class="font-serif text-lg font-semibold text-highlighted">
          {{ optionsStore.getLocaleValue(group.title) }}
        </h2>
        <span class="shrink-0 text-sm text-dimmed">
          {{ group.type === 'remove' ? 'Abwählen zum Weglassen' : 'Optional' }}
        </span>
      </div>

      <div class="mt-3 grid grid-cols-1 gap-x-6 sm:grid-cols-2">
        <label
          v-for="option in group.options"
          :key="option.id"
          class="flex cursor-pointer flex-row items-center gap-3 border-b border-default py-2.5 last:border-b-0 sm:last:border-b"
        >
          <UCheckbox
            :model-value="istGewaehlt(group, option)"
            size="lg"
            @update:model-value="(wert) => umschalten(group, option, wert === true)"
          />

          <span
            class="flex-1 text-base"
            :class="group.type === 'remove' && !istGewaehlt(group, option) ? 'text-dimmed line-through' : 'text-default'"
          >
            {{ optionsStore.getLocaleValue(option.title) }}
          </span>

          <span
            v-if="option.priceChange > 0"
            class="shrink-0 text-sm font-medium text-secondary"
          >
            + {{ optionsStore.formatCurrency(option.priceChange) }} {{ optionsStore.currencySign }}
          </span>
        </label>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ProductOption, ProductOptionGroup } from '@nextorders/food-schema'

const props = defineProps<{
  groups: ProductOptionGroup[]
}>()

/**
 * Die Kennungen, die ans Backend gehen.
 *
 * Bei "remove"-Gruppen wird gemeldet, was der Gast **abgewählt** hat —
 * das Häkchen bedeutet "ist drin". Bei "add"-Gruppen wird gemeldet,
 * was er **dazugewählt** hat.
 */
const model = defineModel<string[]>({ default: () => [] })

const optionsStore = useOptionsStore()

// Abgewählte Zutaten merken wir uns getrennt von den Extras, weil die
// Anzeige (Häkchen) bei "remove" genau umgekehrt zur Meldung ist.
const abgewaehlt = ref<Set<string>>(new Set())
const dazugewaehlt = ref<Set<string>>(new Set())

function istGewaehlt(group: ProductOptionGroup, option: ProductOption): boolean {
  return group.type === 'remove'
    ? !abgewaehlt.value.has(option.id)
    : dazugewaehlt.value.has(option.id)
}

function umschalten(group: ProductOptionGroup, option: ProductOption, angehakt: boolean) {
  const menge = group.type === 'remove' ? abgewaehlt.value : dazugewaehlt.value
  const solldrin = group.type === 'remove' ? !angehakt : angehakt

  if (solldrin) {
    menge.add(option.id)
  } else {
    menge.delete(option.id)
  }

  // Neue Menge zuweisen, damit Vue die Änderung bemerkt
  if (group.type === 'remove') {
    abgewaehlt.value = new Set(menge)
  } else {
    dazugewaehlt.value = new Set(menge)
  }

  model.value = [...abgewaehlt.value, ...dazugewaehlt.value]
}

// Wechselt der Gast das Gericht, ist die alte Auswahl hinfällig
watch(() => props.groups, () => {
  abgewaehlt.value = new Set()
  dazugewaehlt.value = new Set()
  model.value = []
})

/** Aufpreis aller gewählten Extras, für die Preisanzeige */
const aufpreis = computed(() => {
  let summe = 0
  for (const group of props.groups) {
    for (const option of group.options) {
      if (dazugewaehlt.value.has(option.id)) {
        summe += option.priceChange
      }
    }
  }
  return summe
})

defineExpose({ aufpreis })
</script>
