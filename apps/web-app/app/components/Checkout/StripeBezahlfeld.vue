<template>
  <div class="flex flex-col gap-3">
    <template v-if="laedt">
      <div class="flex items-center gap-3 rounded-lg border border-default px-4 py-6 text-muted">
        <UIcon name="i-lucide-loader-circle" class="size-5 motion-preset-spin" />
        <span>Bezahlmöglichkeiten werden geladen …</span>
      </div>
    </template>

    <template v-else-if="fehler">
      <CheckoutInfoMessage icon="alert" :message="fehler" />
    </template>

    <!--
      Apple Pay, Google Pay und PayPal. Stripe zeigt hier nur, was das
      Gerät des Gastes wirklich kann: Apple Pay erscheint in Safari auf
      iPhone und Mac, Google Pay in Chrome. Auf einem Gerät ohne beides
      bleibt der Bereich leer — deshalb steht darunter immer noch die
      Karteneingabe.
    -->
    <div v-show="!laedt && !fehler" ref="expressFeld" />

    <div v-show="zeigeTrenner" class="flex items-center gap-3 text-sm text-dimmed">
      <span class="h-px flex-1 bg-default" />
      <span>oder mit Karte</span>
      <span class="h-px flex-1 bg-default" />
    </div>

    <div v-show="!laedt && !fehler" ref="kartenFeld" />
  </div>
</template>

<script setup lang="ts">
/**
 * Das eingebettete Stripe-Bezahlfeld.
 *
 * Die Kartennummer wird in einem Rahmen von Stripe eingegeben und
 * berührt dieses Projekt nie — sie läuft weder über unseren Server noch
 * durch unser JavaScript.
 *
 * Bezahlt wird über `bezahlen()`, das die Kasse von außen aufruft. Bei
 * PayPal verlässt der Gast dabei kurz die Seite und landet danach auf
 * `/bezahlt`.
 */
const emit = defineEmits<{ bezahlt: [orderId: string] }>()

const { public: { stripePublishableKey } } = useRuntimeConfig()

const orderStore = useOrderStore()

const expressFeld = useTemplateRef<HTMLElement>('expressFeld')
const kartenFeld = useTemplateRef<HTMLElement>('kartenFeld')

const laedt = ref(true)
const fehler = ref('')
const zeigeTrenner = ref(false)

let stripe: StripeInstanz | null = null
let elements: StripeElements | null = null
let clientSecret = ''

/** Angaben aus der Kasse, die mit der Zahlung gespeichert werden */
function bestelldaten() {
  return {
    phone: orderStore.phone,
    name: orderStore.name,
    paymentMethodId: orderStore.paymentMethodId,
    readyBy: orderStore.readyBy,
    readyType: orderStore.readyType,
    address: orderStore.address,
    note: orderStore.note,
  }
}

async function aufbauen() {
  laedt.value = true
  fehler.value = ''

  try {
    const zahlung = await orderStore.starteOnlineZahlung(bestelldaten())
    if (!zahlung?.clientSecret) {
      throw new Error('kein clientSecret')
    }

    clientSecret = zahlung.clientSecret

    stripe = await ladeStripe(stripePublishableKey)
    if (!stripe) {
      throw new Error('Stripe.js nicht geladen')
    }

    elements = stripe.elements({
      clientSecret,
      appearance: {
        // Die Kasse ist dunkel — ein weißes Bezahlfeld mittendrin wäre
        // ein Bruch
        theme: 'night',
        variables: {
          colorPrimary: '#d4a95c',
          colorBackground: '#121212',
          borderRadius: '8px',
        },
      },
    })

    const express = elements.create('expressCheckout', {
      buttonHeight: 48,
    })
    express.on('ready', (daten) => {
      // Stripe meldet, welche Schaltflächen es tatsächlich anzeigt.
      // Nur dann ergibt der Trenner "oder mit Karte" einen Sinn.
      const verfuegbar = (daten as { availablePaymentMethods?: Record<string, boolean> } | undefined)?.availablePaymentMethods
      zeigeTrenner.value = !!verfuegbar && Object.values(verfuegbar).some(Boolean)
    })
    express.on('confirm', () => {
      void bezahlen()
    })

    const karte = elements.create('payment', {
      layout: 'tabs',
    })

    if (expressFeld.value) {
      express.mount(expressFeld.value)
    }
    if (kartenFeld.value) {
      karte.mount(kartenFeld.value)
    }

    laedt.value = false
  } catch {
    laedt.value = false
    fehler.value = 'Die Bezahlmöglichkeiten konnten nicht geladen werden. Bitte lade die Seite neu oder wähle „Barzahlung bei Abholung".'
  }
}

/**
 * Ändert sich der Warenkorb, während das Feld schon steht, muss der
 * Betrag bei Stripe nachgezogen werden — sonst würde der alte Betrag
 * eingezogen.
 */
watch(() => orderStore.totalPrice, useDebounceFn(async () => {
  if (laedt.value || fehler.value || !elements) {
    return
  }

  try {
    await orderStore.starteOnlineZahlung(bestelldaten())
    await elements.fetchUpdates()
  } catch {
    fehler.value = 'Der Betrag konnte nicht aktualisiert werden. Bitte lade die Seite neu.'
  }
}, 800))

async function bezahlen() {
  if (!stripe || !elements) {
    return
  }

  fehler.value = ''

  const { error, paymentIntent } = await stripe.confirmPayment({
    elements,
    clientSecret,
    confirmParams: {
      // Für Verfahren wie PayPal, die den Gast von der Seite führen
      return_url: `${window.location.origin}/bezahlt`,
    },
    // Nur weiterleiten, wenn das Verfahren es verlangt. Karte, Apple Pay
    // und Google Pay bleiben damit in der Kasse.
    redirect: 'if_required',
  })

  if (error) {
    fehler.value = error.message ?? 'Die Zahlung wurde nicht abgeschlossen.'
    return
  }

  if (paymentIntent?.status !== 'succeeded') {
    fehler.value = 'Die Zahlung wurde nicht abgeschlossen. Es wurde nichts abgebucht.'
    return
  }

  try {
    const ergebnis = await $fetch('/api/payment/confirm', {
      method: 'POST',
      body: { zahlungId: paymentIntent.id },
    })

    emit('bezahlt', ergebnis.orderId)
  } catch {
    // Das Geld ist da, nur die Bestätigung kam nicht durch. Der Webhook
    // holt das nach, deshalb keine Panikmeldung.
    fehler.value = 'Die Zahlung ist eingegangen, die Bestätigung dauert einen Moment. Bitte diese Seite nicht schließen.'
  }
}

onMounted(aufbauen)

defineExpose({ bezahlen })
</script>
