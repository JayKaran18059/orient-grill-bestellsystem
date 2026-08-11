import type { GatewayCompleteOrderResponse } from '@nextorders/food-schema'
import { prisma } from '@nextorders/db'
import { OrderSchema } from '@nextorders/food-schema'
import { createId } from '@paralleldrive/cuid2'
import { entwerteDiscountCode, pruefeDiscountCode } from '../../utils/discountCode'
import { awardStampForOrder } from '../../utils/loyalty'

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

    const { user } = await getUserSession(event)

    // Gutscheincode serverseitig prüfen — nie dem im Entwurf
    // gespeicherten discountPercent oder Client-Angaben vertrauen.
    // Der Browser schickt nur den eingetippten Code; wie viel Rabatt
    // dahintersteckt, entscheidet allein die Datenbank.
    const itemsTotal = order.result.items.reduce((total, item) => total + item.totalPrice, 0)
    const customer = user?.customerId
      ? await prisma.customer.findUnique({ where: { id: user.customerId } })
      : null

    const eingegebenerCode = typeof body?.discountCode === 'string' ? body.discountCode : ''
    const pruefung = customer && eingegebenerCode
      ? await pruefeDiscountCode(customer.id, eingegebenerCode, itemsTotal)
      : { ok: false as const }

    if (eingegebenerCode && !pruefung.ok) {
      throw createError({
        statusCode: 400,
        message: 'discount-code-invalid',
      })
    }

    const completedOrder = await fetchApi({
      type: 'completeOrder',
      body: {
        ...order.result,
        ...data,
        discountPercent: pruefung.ok ? pruefung.code.discountPercent : undefined,
      },
    })
    if (!completedOrder.result) {
      throw createError({
        statusCode: 404,
        message: 'Order not found',
      })
    }

    // Beleg schreiben, bevor irgendetwas anderes passiert. essence hält
    // die Bestellung ab hier nur im Arbeitsspeicher — der nächste
    // Neustart würde sie sonst spurlos verschlucken.
    await speichereBestellung(completedOrder.result, user?.customerId)

    // Remove order from session and add it to completed orders.
    // Bestehende Felder (Login-Status: customerId/email/name) bleiben
    // erhalten — nur orderId/completedOrderIds werden aktualisiert.
    await replaceUserSession(event, {
      user: {
        ...user,
        id: user?.id || createId(),
        orderId: undefined,
        completedOrderIds: [...(user?.completedOrderIds || []), completedOrder.result.id],
      },
    })

    // Code entwerten, sobald die Bestellung wirklich durch ist.
    // Schlägt das fehl (etwa weil derselbe Code parallel verbraucht
    // wurde), bleibt die Bestellung gültig — der Gast hat schließlich
    // bestellt, und ein doppelt gewährter Rabatt ist das kleinere
    // Übel als eine verlorene Bestellung.
    if (pruefung.ok) {
      const entwertet = await entwerteDiscountCode(pruefung.code.id, completedOrder.result.id)
      if (!entwertet) {
        console.warn(`[Gutschein] Code ${pruefung.code.code} war bereits entwertet`)
      }
    }

    if (user?.customerId) {
      await awardStampForOrder(user.customerId, completedOrder.result.id, pruefung.ok)
    }

    return completedOrder.result
  } catch (error) {
    throw errorResolver(error)
  }
})
