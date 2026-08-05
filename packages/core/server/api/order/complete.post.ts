import type { GatewayCompleteOrderResponse } from '@nextorders/food-schema'
import { prisma } from '@nextorders/db'
import { OrderSchema } from '@nextorders/food-schema'
import { createId } from '@paralleldrive/cuid2'
import { awardStampForOrder, isDiscountEligible, REWARD_DISCOUNT_PERCENT } from '../../utils/loyalty'

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

    // Treuerabatt serverseitig gegen den aktuellen Datenbank-Stand
    // prüfen — nie den im Entwurf gespeicherten discountPercent oder
    // Client-Angaben aus `data` vertrauen (könnten veraltet oder
    // manipuliert sein).
    const itemsTotal = order.result.items.reduce((total, item) => total + item.totalPrice, 0)
    const customer = user?.customerId
      ? await prisma.customer.findUnique({ where: { id: user.customerId } })
      : null
    const rewardWillBeRedeemed = !!customer && isDiscountEligible(customer.rewardAvailable, itemsTotal)

    const completedOrder = await fetchApi({
      type: 'completeOrder',
      body: {
        ...order.result,
        ...data,
        discountPercent: rewardWillBeRedeemed ? REWARD_DISCOUNT_PERCENT : undefined,
      },
    })
    if (!completedOrder.result) {
      throw createError({
        statusCode: 404,
        message: 'Order not found',
      })
    }

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

    if (user?.customerId) {
      await awardStampForOrder(user.customerId, completedOrder.result.id, rewardWillBeRedeemed)
    }

    return completedOrder.result
  } catch (error) {
    throw errorResolver(error)
  }
})
