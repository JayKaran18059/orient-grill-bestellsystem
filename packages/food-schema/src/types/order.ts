import z from 'zod'
import { PaymentMethodSchema } from './payment'

export const DeliveryMethodSchema = z.enum([
  'deliveryByCourier',
  'selfPickup',
])
export type DeliveryMethod = z.infer<typeof DeliveryMethodSchema>

export const TimeTypeSchema = z.enum(['asap', 'scheduled'])
export type TimeType = z.infer<typeof TimeTypeSchema>

/**
 * Eine vom Gast getroffene Wahl, festgehalten am Bestellposten.
 *
 * Der Titel wird mitgespeichert, damit die Küche die Bestellung auch
 * dann noch richtig liest, wenn die Speisekarte inzwischen geändert
 * wurde.
 */
export const OrderItemOptionSchema = z.object({
  groupId: z.string(),
  optionId: z.string(),
  title: z.string(),
  type: z.enum(['remove', 'add']),
  priceChange: z.number().default(0),
})
export type OrderItemOption = z.infer<typeof OrderItemOptionSchema>

export const OrderItemSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  productId: z.string(),
  productSlug: z.string(),
  categoryId: z.string(),
  categorySlug: z.string(),
  variantId: z.string(),
  quantity: z.number().positive(),
  unitPrice: z.number().nonnegative(),
  totalPrice: z.number().nonnegative(), // quantity × unitPrice
  /** Abgewählte Zutaten und bestellte Extras */
  selectedOptions: OrderItemOptionSchema.array().default([]),
})
export type OrderItem = z.infer<typeof OrderItemSchema>

export const OrderItemChangeSchema = z.object({
  orderId: z.string(),
  itemId: z.string(),
  method: z.enum(['increment', 'decrement']),
})
export type OrderItemChange = z.infer<typeof OrderItemChangeSchema>

export const OrderStatusSchema = z.enum(['draft', 'created', 'ready', 'delivered'])
export type OrderStatus = z.infer<typeof OrderStatusSchema>

export const OrderDeliveryAddressSchema = z.object({
  type: z.literal('deliveryAddress'),
  street: z.string(),
  flat: z.string().optional(),
  intercom: z.string().optional(),
  entrance: z.string().optional(),
  floor: z.string().optional(),
  addressNote: z.string().optional(),
  lat: z.number().nullable().optional(),
  lon: z.number().nullable().optional(),
})
export type OrderDeliveryAddress = z.infer<typeof OrderDeliveryAddressSchema>

export const OrderWarehouseAddressSchema = z.object({
  type: z.literal('warehouseAddress'),
  id: z.string(),
})
export type OrderWarehouseAddress = z.infer<typeof OrderWarehouseAddressSchema>

export const OrderSchema = z.object({
  id: z.string(),
  status: OrderStatusSchema,

  /** Time */
  createdAt: z.string(),
  readyBy: z.string(),
  readyType: TimeTypeSchema,

  /** Delivery */
  deliveryMethod: DeliveryMethodSchema,
  address: z.union([
    OrderDeliveryAddressSchema,
    OrderWarehouseAddressSchema,
  ]),

  /** Payment */
  paymentMethodId: PaymentMethodSchema.shape.id,
  /** Amount of cash that client has to pay if choose cash */
  changeFrom: z.number().nonnegative().optional(),
  totalPrice: z.number().nonnegative(),
  /** Treuerabatt in Prozent (z.B. 20 für 20 %), angewendet in recalculateOrder */
  discountPercent: z.number().min(0).max(100).optional(),

  /** Client */
  name: z.string(),
  phone: z.string(),

  /** Additional instructions */
  note: z.string().optional(),

  /** Items included in the order */
  items: OrderItemSchema.array(),
})
export type Order = z.infer<typeof OrderSchema>

/**
 * Address Suggestion
 */
export const AddressSuggestionSchema = z.object({
  value: z.string(),
  lat: z.number().nullable(),
  lon: z.number().nullable(),
  data: z.record(z.string(), z.unknown()).optional(),
})
export type AddressSuggestion = z.infer<typeof AddressSuggestionSchema>
