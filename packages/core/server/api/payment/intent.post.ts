import { OrderSchema } from '@nextorders/food-schema'
import { ermittleRechnung } from '../../utils/orderCompletion'

/**
 * Legt die Zahlung an und gibt das `client_secret` zurück. Damit baut
 * der Browser das Bezahlfeld auf — Apple Pay, Google Pay und PayPal als
 * eigene Schaltflächen, die Karte als Eingabefeld darunter.
 *
 * Der Betrag wird hier auf dem Server aus der Bestellung berechnet. Ein
 * aus dem Browser mitgeschickter Betrag wäre wertlos — den könnte jeder
 * auf einen Euro setzen.
 *
 * Wird die Route erneut aufgerufen, während zu dieser Bestellung schon
 * eine offene Zahlung liegt, wird deren Betrag angepasst statt eine
 * zweite anzulegen. Sonst entstünde bei jeder Änderung am Warenkorb eine
 * weitere Zahlung und am Ende wüsste niemand, welche gilt.
 *
 * Der Beleg wird schon jetzt vorgemerkt (`pending`), bevor bezahlt ist.
 * Damit geht eine bezahlte Bestellung auch dann nicht verloren, wenn der
 * Gast direkt nach dem Bezahlen den Browser schließt: Der Webhook findet
 * sie über die Kennung der Zahlung wieder.
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

    const offeneZahlung = await ladeOffeneZahlung(orderId)

    const zahlung = offeneZahlung
      ? await aktualisiereZahlungsbetrag(offeneZahlung, rechnung.endbetrag)
      : await erstelleZahlung({
          betrag: rechnung.endbetrag,
          orderId,
          beschreibung: `Orient Grill — Bestellung ${orderId}`,
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
      { status: 'pending', stripePaymentId: zahlung.id },
    )

    return {
      clientSecret: zahlung.client_secret,
      zahlungId: zahlung.id,
      betrag: rechnung.endbetrag,
    }
  } catch (error) {
    throw errorResolver(error)
  }
})
