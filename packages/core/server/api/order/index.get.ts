import type { GatewayGetOrderResponse } from '@nextorders/food-schema'
import { prisma } from '@nextorders/db'
import { H3Error } from 'h3'
import { isDiscountEligible, REWARD_DISCOUNT_PERCENT } from '../../utils/loyalty'

export default defineEventHandler<Promise<GatewayGetOrderResponse['result']>>(async (event) => {
  try {
    const orderId = await getOrderId(event, false)

    const order = await fetchApi({
      type: 'getOrder',
      body: {
        id: orderId ?? undefined,
      },
    })
    if (!order?.result) {
      throw createError({
        statusCode: 404,
        message: 'Not found',
      })
    }

    // Treuerabatt live an den Warenkorb-Inhalt koppeln: reagiert sofort,
    // wenn Artikel dazukommen/wegfallen und die Mindestbestellsumme
    // über- bzw. unterschritten wird.
    const { user } = await getUserSession(event)
    if (user?.customerId) {
      const customer = await prisma.customer.findUnique({ where: { id: user.customerId } })
      const itemsTotal = order.result.items.reduce((total, item) => total + item.totalPrice, 0)
      const eligible = !!customer && isDiscountEligible(customer.rewardAvailable, itemsTotal)
      const desiredDiscountPercent = eligible ? REWARD_DISCOUNT_PERCENT : undefined

      if ((order.result.discountPercent ?? undefined) !== desiredDiscountPercent) {
        const updated = await fetchApi({
          type: 'updateOrder',
          body: {
            id: order.result.id,
            discountPercent: desiredDiscountPercent,
          },
        })
        if (updated?.result) {
          return updated.result
        }
      }
    }

    return order.result
  } catch (error) {
    if (error instanceof H3Error) {
      // Maybe order doesn't exist on backend?
      await checkAndResetOrderInSession(event, error)
    }

    throw errorResolver(error)
  }
})
