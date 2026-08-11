import z from 'zod'
import { LocaleValueSchema } from './common'

/**
 * `cash` und `card` werden erst beim Abholen bezahlt — der Laden
 * kassiert selbst, die Wahl ist nur eine Notiz an der Bestellung.
 * `online` heißt im Voraus bezahlt: die Bestellung gilt erst als
 * aufgegeben, wenn das Geld bestätigt ist.
 */
export const PaymentMethodTypeSchema = z.enum(['cash', 'card', 'online', 'custom'])
export type PaymentMethodType = z.infer<typeof PaymentMethodTypeSchema>

export const PaymentMethodSchema = z.object({
  id: z.string(),
  title: LocaleValueSchema.array(),
  type: PaymentMethodTypeSchema,
  /** Kurzer Zusatz unter dem Namen, z.B. "Sofort bezahlen" */
  hint: LocaleValueSchema.array().optional(),
})
export type PaymentMethod = z.infer<typeof PaymentMethodSchema>
