import type { GatewayGetOrderResponse } from '@nextorders/food-schema'
import { prisma } from '@nextorders/db'
import { H3Error } from 'h3'

export default defineEventHandler<Promise<GatewayGetOrderResponse['result']>>(async (event) => {
  try {
    const orderId = getRouterParam(event, 'orderId')
    if (!orderId) {
      throw createError({
        statusCode: 404,
        message: 'Not found',
      })
    }

    // Guard: check if order belongs to the current session (guest
    // checkout, same browser) or — kontoweit, auch von einem anderen
    // Gerät — zum eingeloggten Kunden (nachgewiesen über die
    // Stempelkarten-Historie, da essence selbst keine Kunden kennt).
    const { user } = await getUserSession(event)
    const ownsViaSession = !!user?.completedOrderIds?.includes(orderId)
    const ownsViaAccount = user?.customerId
      ? !!(await prisma.loyaltyEvent.findFirst({ where: { customerId: user.customerId, orderId } }))
      : false

    if (!ownsViaSession && !ownsViaAccount) {
      throw createError({
        statusCode: 404,
        message: 'Not found',
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

    return order.result
  } catch (error) {
    if (error instanceof H3Error) {
      // Maybe order doesn't exist on backend?
      await checkAndResetOrderInSession(event, error)
    }

    throw errorResolver(error)
  }
})
