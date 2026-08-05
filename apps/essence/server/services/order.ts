import type { GatewayAddOrderItemRequest, GatewayAddOrderItemResponse, GatewayCompleteOrderRequest, GatewayCompleteOrderResponse, GatewayCreateOrderResponse, GatewayDecrementOrderItemQuantityRequest, GatewayDecrementOrderItemQuantityResponse, GatewayGetOrderRequest, GatewayGetOrderResponse, GatewayIncrementOrderItemQuantityRequest, GatewayIncrementOrderItemQuantityResponse, GatewayUpdateOrderRequest, GatewayUpdateOrderResponse, Order, OrderItem, OrderItemOption } from '@nextorders/food-schema'
import { createId } from '@paralleldrive/cuid2'
import { handleGetMenu } from './menu'

const logger = useLogger('order')

const orders = new Map<Order['id'], Order>()

function findOrder(id: string): Order | undefined {
  return orders.get(id)
}

function createOrder(): Order {
  const newOrder: Order = {
    id: createId(),
    status: 'draft',
    createdAt: new Date().toISOString(),
    readyBy: '',
    readyType: 'asap',
    // Der Orient Grill liefert nicht, es wird abgeholt. Stünde hier
    // 'deliveryByCourier', würde die Seite dem Gast "Lieferung"
    // anzeigen und nach einer Lieferadresse fragen.
    // Sobald geliefert wird: hier und in channel.ts umstellen.
    deliveryMethod: 'selfPickup',
    paymentMethodId: '',
    // Eine Abholadresse besteht nur aus der Kennung des Standorts —
    // Straße, Etage und Klingel braucht es dafür nicht. Es gibt genau
    // einen Standort, deshalb ist er gleich vorbelegt.
    address: {
      type: 'warehouseAddress',
      id: 'margaretenstrasse',
    },
    items: [],
    totalPrice: 0,
    note: '',
    name: '',
    phone: '',
  }

  orders.set(newOrder.id, newOrder)

  logger.success(`Order created: ${newOrder.id}`)

  return newOrder
}

function updateOrder(id: string, data: Partial<Order>): Order | undefined {
  const order = findOrder(id)
  if (!order) {
    return
  }

  orders.set(id, {
    ...order,
    ...data,
  })

  logger.success(`Order updated: ${id}`)

  return orders.get(id) as Order
}

function recalculateOrder(order: Order): Order {
  // For each
  order.items = order.items.map((item) => ({
    ...item,
    totalPrice: item.unitPrice * item.quantity,
  }))

  // Total price
  const itemsTotal = order.items.reduce((total, item) => total + item.totalPrice, 0)
  const discountPercent = order.discountPercent ?? 0
  order.totalPrice = itemsTotal * (1 - discountPercent / 100)

  return order
}

export function handleGetOrder({ id }: GatewayGetOrderRequest['body']): GatewayGetOrderResponse {
  if (!id) {
    return {
      ok: true,
      type: 'getOrder',
      result: null,
    }
  }

  const order = findOrder(id)
  if (!order) {
    return {
      ok: true,
      type: 'getOrder',
      result: null,
    }
  }

  return {
    ok: true,
    type: 'getOrder',
    result: order,
  }
}

export function handleCreateOrder(): GatewayCreateOrderResponse {
  const order = createOrder()
  return {
    ok: true,
    type: 'createOrder',
    result: order,
  }
}

export function handleUpdateOrder(data: GatewayUpdateOrderRequest['body']): GatewayUpdateOrderResponse {
  if (!data.id) {
    throw new Error('Order id is required')
  }

  let order = updateOrder(data.id, data)
  if (!order) {
    throw new Error('Order not found')
  }

  // Wichtig für discountPercent: totalPrice muss neu berechnet werden,
  // sonst zeigt der Warenkorb den Rabatt erst nach der nächsten
  // Artikel-Änderung an.
  order = recalculateOrder(order)
  orders.set(order.id, order)

  return {
    ok: true,
    type: 'updateOrder',
    result: order,
  }
}

export function handleCompleteOrder(data: GatewayCompleteOrderRequest['body']): GatewayCompleteOrderResponse {
  if (!data.id) {
    throw new Error('Order id is required')
  }

  const order = findOrder(data.id)
  if (!order) {
    throw new Error('Order not found')
  }

  // Guard: if order is not in status "draft" - can't complete it
  if (order.status !== 'draft') {
    throw new Error('Order is not in draft status')
  }

  const completedOrder = updateOrder(data.id, {
    ...data,
    status: 'created',
  })
  if (!completedOrder) {
    throw new Error('Order not found')
  }

  logger.success(`Order completed: ${completedOrder.id}`, completedOrder)

  return {
    ok: true,
    type: 'completeOrder',
    result: completedOrder,
  }
}

export function handleAddOrderItem({ orderId, variantId, selectedOptionIds }: GatewayAddOrderItemRequest['body']): GatewayAddOrderItemResponse {
  const menu = handleGetMenu().result

  const category = menu.categories.find((category) => category.products.find((product) => product.variants.find((variant) => variant.id === variantId)))
  if (!category) {
    throw new Error('Category not found')
  }

  const product = menu.categories.flatMap((category) => category.products).find((product) => product.variants.find((variant) => variant.id === variantId))
  if (!product) {
    throw new Error('Product not found')
  }

  const variant = product.variants.find((variant) => variant.id === variantId)
  if (!variant) {
    throw new Error('Variant not found')
  }

  // Aus den übergebenen Kennungen die echten Optionen heraussuchen.
  // Titel und Aufpreis kommen bewusst aus der Speisekarte, nicht vom
  // Gast — sonst könnte man sich die Extras selbst billiger machen.
  const selectedOptions: OrderItemOption[] = (selectedOptionIds ?? []).flatMap((optionId) => {
    for (const group of product.optionGroups ?? []) {
      const option = group.options.find((o) => o.id === optionId)
      if (option) {
        return [{
          groupId: group.id,
          optionId: option.id,
          title: option.title[0]?.value ?? option.id,
          type: group.type,
          priceChange: option.priceChange,
        }]
      }
    }
    // Unbekannte Kennung: stillschweigend verwerfen statt die
    // ganze Bestellung scheitern zu lassen.
    return []
  })

  const aufpreis = selectedOptions.reduce((summe, option) => summe + option.priceChange, 0)
  const einzelpreis = variant.price + aufpreis

  const newItem: OrderItem = {
    variantId,
    orderId,
    id: createId(),
    categoryId: category.id,
    categorySlug: category.slug,
    productId: product.id,
    productSlug: product.slug,
    quantity: 1,
    unitPrice: einzelpreis,
    totalPrice: einzelpreis,
    selectedOptions,
  }

  const order = findOrder(orderId)
  if (!order) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Not found',
      message: `Order id ${orderId} not found`,
    })
  }

  const updatedOrder = updateOrder(orderId, {
    ...order,
    items: [
      ...order.items,
      newItem,
    ],
  })
  if (!updatedOrder) {
    throw new Error('Order not found')
  }

  const recalculatedOrder = recalculateOrder(updatedOrder)

  return {
    ok: true,
    type: 'addOrderItem',
    result: recalculatedOrder,
  }
}

export function handleChangeOrderItemQuantity(data: GatewayIncrementOrderItemQuantityRequest['body'] | GatewayDecrementOrderItemQuantityRequest['body']): GatewayIncrementOrderItemQuantityResponse | GatewayDecrementOrderItemQuantityResponse {
  const order = findOrder(data.orderId)
  if (!order) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Not found',
      message: `Order id ${data.orderId} not found`,
    })
  }

  const item = order.items.find((item) => item.id === data.itemId)
  if (!item) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Not found',
      message: `Item id ${data.itemId} not found`,
    })
  }

  const newQuantity = item.quantity + (data.method === 'increment' ? 1 : -1)
  if (newQuantity <= 0) {
    // Remove item
    order.items = order.items.filter((item) => item.id !== data.itemId)
  } else {
    // Update quantity
    item.quantity = newQuantity
  }

  const updatedOrder = updateOrder(data.orderId, order)
  if (!updatedOrder) {
    throw new Error('Order not found')
  }

  const recalculatedOrder = recalculateOrder(updatedOrder)

  return {
    ok: true,
    type: data.method === 'increment' ? 'incrementOrderItemQuantity' : 'decrementOrderItemQuantity',
    result: recalculatedOrder,
  }
}
