import type { GatewayGetOrderResponse } from '@nextorders/food-schema'
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
    // Gerät — zum eingeloggten Kunden.
    const { user } = await getUserSession(event)
    const ownsViaSession = !!user?.completedOrderIds?.includes(orderId)
    const ownsViaAccount = user?.customerId
      ? await gehoertBestellungZuKunde(orderId, user.customerId)
      : false

    if (!ownsViaSession && !ownsViaAccount) {
      throw createError({
        statusCode: 404,
        message: 'Not found',
      })
    }

    // essence zuerst fragen: nur dort steht der aktuelle Zustand, falls
    // die Bestellung seit dem Abschicken weitergelaufen ist.
    const order = await fetchApi({
      type: 'getOrder',
      body: {
        id: orderId,
      },
    }).catch(() => null)

    if (order?.result) {
      return order.result
    }

    // essence kennt sie nicht mehr — nach einem Neustart der Normalfall.
    // Dann zählt der gespeicherte Beleg.
    const beleg = await ladeBestellung(orderId)
    if (!beleg) {
      throw createError({
        statusCode: 404,
        message: 'Not found',
      })
    }

    return beleg
  } catch (error) {
    if (error instanceof H3Error) {
      // Maybe order doesn't exist on backend?
      await checkAndResetOrderInSession(event, error)
    }

    throw errorResolver(error)
  }
})
