import { OrderSchema } from '@nextorders/food-schema'
import { ermittleRechnung } from '../../utils/orderCompletion'

/**
 * Legt die Stripe-Bezahlseite an und gibt ihre Adresse zurück. Der
 * Browser schickt den Gast dorthin weiter.
 *
 * Der Betrag wird hier auf dem Server aus der Bestellung berechnet. Ein
 * aus dem Browser mitgeschickter Betrag wäre wertlos — den könnte jeder
 * auf einen Euro setzen.
 *
 * Der Beleg wird schon jetzt vorgemerkt (`pending`), bevor bezahlt ist.
 * Damit geht eine bezahlte Bestellung auch dann nicht verloren, wenn der
 * Gast direkt nach dem Bezahlen den Browser schließt: Der Webhook findet
 * sie über die Kennung der Bezahlseite wieder.
 */
export default defineEventHandler(async (event) => {
  try {
    if (!istStripeEingerichtet()) {
      throw createError({
        statusCode: 503,
        message: 'payment-not-configured',
      })
    }

    const body = await readBody(event)
    const daten = OrderSchema.partial().parse(body)

    const orderId = await getOrderId(event, false)
    if (!orderId) {
      throw createError({
        statusCode: 404,
        message: 'Order not found',
      })
    }

    const entwurf = await fetchApi({
      type: 'getOrder',
      body: { id: orderId },
    })
    if (!entwurf?.result) {
      throw createError({
        statusCode: 404,
        message: 'Not found',
      })
    }

    if (entwurf.result.status !== 'draft') {
      throw createError({
        statusCode: 400,
        message: 'Order is not in "draft" status',
      })
    }

    if (entwurf.result.items.length === 0) {
      throw createError({
        statusCode: 400,
        message: 'order-empty',
      })
    }

    const { user } = await getUserSession(event)

    const rechnung = await ermittleRechnung({
      order: entwurf.result,
      customerId: user?.customerId,
      eingegebenerCode: typeof body?.discountCode === 'string' ? body.discountCode : '',
    })

    if (rechnung.endbetrag <= 0) {
      throw createError({
        statusCode: 400,
        message: 'order-empty',
      })
    }

    // Ohne hinterlegte Adresse käme der Gast nach dem Bezahlen nirgends
    // wieder heraus. Lieber vorher abbrechen als hinterher Geld ohne
    // Rückweg einzunehmen.
    const { public: { siteUrl } } = useRuntimeConfig()
    if (!siteUrl) {
      throw createError({
        statusCode: 503,
        message: 'site-url-missing',
      })
    }

    const sitzung = await erstelleKassenSitzung({
      betrag: rechnung.endbetrag,
      orderId,
      beschreibung: `Orient Grill — Bestellung ${orderId}`,
      // {CHECKOUT_SESSION_ID} setzt Stripe selbst ein
      erfolgUrl: `${siteUrl}/bezahlt?sitzung={CHECKOUT_SESSION_ID}`,
      abbruchUrl: `${siteUrl}/checkout?zahlung=abgebrochen`,
      merkmale: {
        customerId: user?.customerId ?? '',
        gutscheinId: rechnung.gutschein?.id ?? '',
        gutscheinCode: rechnung.gutschein?.code ?? '',
      },
    })

    await speichereBestellung(
      {
        ...entwurf.result,
        ...daten,
        discountPercent: rechnung.discountPercent,
        totalPrice: rechnung.endbetrag,
      },
      user?.customerId,
      { status: 'pending', stripeSessionId: sitzung.id },
    )

    return {
      url: sitzung.url,
      sitzungId: sitzung.id,
      betrag: rechnung.endbetrag,
    }
  } catch (error) {
    throw errorResolver(error)
  }
})
