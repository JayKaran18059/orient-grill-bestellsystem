import type { GatewayAddOrderItemResponse } from '@nextorders/food-schema'
import { OrderItemSchema } from '@nextorders/food-schema'
import z from 'zod'

// Neben dem Bestellposten kommen die Kennungen der gewählten Zutaten
// und Extras mit. Nur die Kennungen — Preise ermittelt das Backend
// selbst aus der Speisekarte.
const RequestSchema = OrderItemSchema.partial().extend({
  selectedOptionIds: z.string().array().optional(),
})

export default defineEventHandler<Promise<GatewayAddOrderItemResponse['result']>>(async (event) => {
  try {
    const body = await readBody(event)
    const data = RequestSchema.parse(body)

    const orderId = await getOrderId(event, true) as string

    const order = await fetchApi({
      type: 'addOrderItem',
      body: {
        orderId,
        variantId: data.variantId!,
        selectedOptionIds: data.selectedOptionIds,
      },
    })
    if (!order.result) {
      throw createError({
        statusCode: 404,
        message: 'Order not found',
      })
    }

    return order.result
  } catch (error) {
    throw errorResolver(error)
  }
})
