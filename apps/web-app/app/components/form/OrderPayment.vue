<template>
  <div class="flex flex-col gap-2">
    <h3 class="text-lg md:text-xl font-semibold">
      {{ $dict('web-app.checkout.payment-title') }}
    </h3>

    <div class="flex flex-col gap-2">
      <button
        v-for="art in verfuegbareZahlungsarten"
        :key="art.id"
        type="button"
        class="flex flex-row items-center gap-3 rounded-lg border px-4 py-3.5 text-left duration-200"
        :class="state.paymentMethodId === art.id
          ? 'border-secondary bg-elevated'
          : 'border-default hover:border-muted'"
        :aria-pressed="state.paymentMethodId === art.id"
        @click="state.paymentMethodId = art.id"
      >
        <UIcon
          :name="symbol(art)"
          class="size-6 shrink-0"
          :class="state.paymentMethodId === art.id ? 'text-secondary' : 'text-muted'"
        />

        <span class="flex flex-1 flex-col">
          <span class="font-medium">{{ optionsStore.getLocaleValue(art.title) }}</span>
          <span v-if="art.hint?.length" class="text-sm text-dimmed">
            {{ optionsStore.getLocaleValue(art.hint) }}
          </span>
        </span>

        <UIcon
          v-if="state.paymentMethodId === art.id"
          name="lucide:check"
          class="size-5 shrink-0 text-secondary"
        />
      </button>
    </div>

    <UFormField v-if="selectedPaymentMethod?.type === 'cash'" :label="$dict('web-app.checkout.change-label')">
      <UInputNumber
        v-model="state.changeFrom"
        size="xl"
        orientation="vertical"
        :increment="false"
        :decrement="false"
        class="w-full"
        :min="0"
        :placeholder="optionsStore.currencySign"
      />
    </UFormField>
  </div>
</template>

<script setup lang="ts">
import type { Order, PaymentMethod } from '@nextorders/food-schema'

const optionsStore = useOptionsStore()
const channelStore = useChannelStore()
const orderStore = useOrderStore()

const { public: { stripePublishableKey } } = useRuntimeConfig()

const paymentMethods = computed(() => orderStore.deliveryMethod === 'deliveryByCourier' ? channelStore.deliveryByCourier?.paymentMethods : channelStore.selfPickup?.paymentMethods)

/**
 * Online bezahlen wird nur angeboten, wenn Stripe eingerichtet ist.
 * Sonst stünde in der Kasse eine Bezahlart, die den Gast beim Anklicken
 * ins Leere laufen ließe.
 */
const verfuegbareZahlungsarten = computed(
  () => (paymentMethods.value ?? []).filter((art) => art.type !== 'online' || !!stripePublishableKey),
)

function symbol(art: PaymentMethod): string {
  switch (art.type) {
    case 'cash':
      return 'lucide:banknote'
    case 'card':
      return 'lucide:credit-card'
    case 'online':
      return 'lucide:smartphone-nfc'
    default:
      return 'lucide:wallet'
  }
}

const state = ref<Pick<Order, 'paymentMethodId' | 'changeFrom'>>({
  paymentMethodId: orderStore.paymentMethodId ?? '',
  changeFrom: orderStore.changeFrom ?? undefined,
})

const selectedPaymentMethod = ref<PaymentMethod | undefined>()

watch(() => state.value.paymentMethodId, () => {
  selectedPaymentMethod.value = paymentMethods.value?.find((p) => p.id === state.value.paymentMethodId)

  // Rückgeld ergibt nur bei Barzahlung einen Sinn. Bliebe der Wert
  // stehen, ginge er als sinnlose Angabe mit der Bestellung raus.
  if (selectedPaymentMethod.value?.type !== 'cash') {
    state.value.changeFrom = undefined
  }
}, { immediate: true })

watch(state, () => {
  orderStore.paymentMethodId = state.value.paymentMethodId
  orderStore.changeFrom = state.value.changeFrom

  orderStore.isSaved = false
}, { deep: true })

watch(() => orderStore.deliveryMethod, () => {
  state.value.paymentMethodId = orderStore.paymentMethodId ?? ''
  state.value.changeFrom = orderStore.changeFrom ?? undefined
})
</script>
