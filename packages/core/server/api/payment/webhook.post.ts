import { finalisiereZahlung } from '../../utils/orderCompletion'

/**
 * Nimmt die Nachrichten von Stripe entgegen.
 *
 * Das ist das Sicherheitsnetz: Schließt der Gast direkt nach dem
 * Bezahlen den Browser, erfährt der Shop nur hierüber, dass das Geld da
 * ist. Ohne diese Route gäbe es bezahlte Bestellungen, von denen die
 * Küche nie erfährt.
 *
 * Im Stripe-Dashboard einzurichten unter Entwickler → Webhooks, mit der
 * Adresse `<Domain>/api/payment/webhook` und dem Ereignis
 * `payment_intent.succeeded`. Das dort angezeigte Geheimnis gehört in
 * `NUXT_STRIPE_WEBHOOK_SECRET`.
 */
export default defineEventHandler(async (event) => {
  const { stripeWebhookSecret } = useRuntimeConfig()

  if (!stripeWebhookSecret) {
    throw createError({
      statusCode: 503,
      message: 'webhook-not-configured',
    })
  }

  // Der Körper muss unverändert bleiben: Die Signatur gilt für genau
  // diese Zeichenfolge, ein Umweg über JSON.parse würde sie verfälschen.
  const koerper = await readRawBody(event)
  const signaturKopf = getHeader(event, 'stripe-signature') ?? ''

  if (!koerper || !pruefeWebhookSignatur({ koerper, signaturKopf, geheimnis: stripeWebhookSecret })) {
    throw createError({
      statusCode: 400,
      message: 'invalid-signature',
    })
  }

  const nachricht = JSON.parse(koerper) as {
    type?: string
    data?: { object?: { id?: string } }
  }

  const zahlungId = nachricht.data?.object?.id

  if (nachricht.type === 'payment_intent.succeeded' && zahlungId) {
    try {
      await finalisiereZahlung(zahlungId)
    } catch (error) {
      // Mit einem Fehler antworten, damit Stripe es später erneut
      // versucht — die Bestellung soll nicht an einem kurzen Aussetzer
      // der Datenbank hängenbleiben.
      console.error(`[Zahlung] Webhook für Zahlung ${zahlungId} fehlgeschlagen:`, error)

      throw createError({
        statusCode: 500,
        message: 'webhook-failed',
      })
    }
  }

  return { empfangen: true }
})
