import type { GatewayCompleteOrderResponse } from '@nextorders/food-schema'
import { OrderSchema } from '@nextorders/food-schema'
import { createId } from '@paralleldrive/cuid2'
import { ermittleRechnung, istOnlineZahlung, schliesseBestellungAb } from '../../utils/orderCompletion'

export default defineEventHandler<Promise<GatewayCompleteOrderResponse['result']>>(async (event) => {
  try {
    const body = await readBody(event)
    const data = OrderSchema.partial().parse(body)

    const orderId = await getOrderId(event, false)
    if (!orderId) {
      throw createError({
        statusCode: 404,
        message: 'Order not found',
      })
    }

    const order = await fetchApi({
      type: 'getOrder',
      body: {
        id: orderId,
      },
    })
    if (!order?.result) {
      throw createError({
        statusCode: 404,
        message: 'Not found',
      })
    }

    // Guard: if order is not in status "draft" - can't complete it
    if (order.result.status !== 'draft') {
      throw createError({
        statusCode: 400,
        message: 'Order is not in "draft" status',
      })
    }

    // Online bezahlte Bestellungen dürfen nicht über diesen Weg
    // hereinkommen — sonst ließe sich die Kasse umgehen, indem man
    // einfach diese Adresse aufruft. Sie laufen über
    // /api/payment/checkout und werden erst nach Stripes Bestätigung
    // abgeschlossen.
    const gewaehlteZahlungsart = data.paymentMethodId ?? order.result.paymentMethodId
    if (await istOnlineZahlung(gewaehlteZahlungsart)) {
      throw createError({
        statusCode: 400,
        message: 'payment-required',
      })
    }

    const { user } = await getUserSession(event)

    // Gutscheincode serverseitig prüfen — nie dem im Entwurf
    // gespeicherten discountPercent oder Client-Angaben vertrauen.
    // Der Browser schickt nur den eingetippten Code; wie viel Rabatt
    // dahintersteckt, entscheidet allein die Datenbank.
    const rechnung = await ermittleRechnung({
      order: order.result,
      customerId: user?.customerId,
      eingegebenerCode: typeof body?.discountCode === 'string' ? body.discountCode : '',
    })

    const completedOrder = await schliesseBestellungAb({
      order: order.result,
      daten: data,
      customerId: user?.customerId,
      discountPercent: rechnung.discountPercent,
      gutschein: rechnung.gutschein,
      zahlung: { status: 'atPickup' },
    })

    // Remove order from session and add it to completed orders.
    // Bestehende Felder (Login-Status: customerId/email/name) bleiben
    // erhalten — nur orderId/completedOrderIds werden aktualisiert.
    await replaceUserSession(event, {
      user: {
        ...user,
        id: user?.id || createId(),
        orderId: undefined,
        completedOrderIds: [...(user?.completedOrderIds || []), completedOrder.id],
      },
    })

    return completedOrder
  } catch (error) {
    throw errorResolver(error)
  }
})
