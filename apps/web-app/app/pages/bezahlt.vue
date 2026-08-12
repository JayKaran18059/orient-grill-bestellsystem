<template>
  <div class="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
    <template v-if="laeuft">
      <UIcon name="i-lucide-loader-circle" class="size-16 text-dimmed/40 motion-preset-spin" />
      <p class="text-lg text-muted">
        Zahlung wird bestätigt …
      </p>
    </template>

    <template v-else>
      <UIcon name="i-lucide-circle-alert" class="size-16 text-dimmed/40" />

      <h1 class="text-2xl font-semibold md:text-3xl">
        Wir konnten die Zahlung nicht bestätigen
      </h1>

      <p class="max-w-md text-muted">
        {{ meldung }}
      </p>

      <div class="flex flex-col gap-3 sm:flex-row">
        <UButton
          to="/checkout"
          size="xl"
          variant="solid"
          color="secondary"
          label="Zurück zur Kasse"
        />
        <UButton
          :to="`tel:${telefon}`"
          size="xl"
          variant="soft"
          color="neutral"
          :label="`Anrufen: ${telefon}`"
        />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
/**
 * Landeplatz für Bezahlverfahren, die den Gast von der Seite führen —
 * PayPal etwa. Karte, Apple Pay und Google Pay kommen hier nie an, die
 * bleiben in der Kasse.
 *
 * Dass der Gast hier ankommt, beweist noch keine Zahlung — die Adresse
 * kann jeder aufrufen. Ob wirklich bezahlt wurde, fragt der Server bei
 * Stripe nach.
 */
definePageMeta({
  layout: 'checkout',
})

const TELEFON = '+49 179 163 9799'

const route = useRoute()
const orderStore = useOrderStore()

const laeuft = ref(true)
const meldung = ref('')
const telefon = TELEFON

onMounted(async () => {
  // Diese beiden Angaben hängt Stripe selbst an die Rückkehr-Adresse
  const zahlungId = route.query.payment_intent?.toString()
  const zustand = route.query.redirect_status?.toString()

  if (!zahlungId) {
    laeuft.value = false
    meldung.value = 'Uns fehlt die Kennung der Zahlung. Falls Geld abgebucht wurde, ruf bitte kurz an — wir klären das sofort.'
    return
  }

  if (zustand && zustand !== 'succeeded') {
    laeuft.value = false
    meldung.value = 'Die Zahlung wurde nicht abgeschlossen — es wurde nichts abgebucht. Du kannst es in der Kasse erneut versuchen.'
    return
  }

  try {
    const ergebnis = await $fetch('/api/payment/confirm', {
      method: 'POST',
      body: { zahlungId },
    })

    // Der Warenkorb ist serverseitig schon geleert, der Speicher im
    // Browser weiß davon noch nichts
    await orderStore.update()

    await navigateTo(`/finish?id=${ergebnis.orderId}`)
  } catch {
    laeuft.value = false
    meldung.value = `Falls Geld abgebucht wurde, ist deine Bestellung bei uns eingegangen — sie erscheint gleich in deinem Konto. Bist du unsicher, ruf bitte kurz unter ${TELEFON} an.`
  }
})

useHead({
  title: 'Zahlung wird bestätigt | Orient Grill Rostock',
})
</script>
