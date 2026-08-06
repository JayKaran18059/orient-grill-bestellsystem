import { pruefeDiscountCode } from '../../utils/discountCode'

/**
 * Prüft einen Gutscheincode, bevor die Bestellung abgeschlossen wird.
 *
 * Rein informativ für die Anzeige — verbindlich geprüft und entwertet
 * wird der Code erst beim Bestellabschluss. Wer hier vorbeimogelt,
 * gewinnt nichts.
 */
export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const code = typeof body?.code === 'string' ? body.code : ''
    const orderTotal = typeof body?.orderTotal === 'number' ? body.orderTotal : 0

    const { user } = await getUserSession(event)
    if (!user?.customerId) {
      return { ok: false, grund: 'unbekannt' as const }
    }

    if (!code.trim()) {
      return { ok: false, grund: 'unbekannt' as const }
    }

    const ergebnis = await pruefeDiscountCode(user.customerId, code, orderTotal)

    return {
      ok: ergebnis.ok,
      grund: ergebnis.grund,
      discountPercent: ergebnis.code?.discountPercent,
      minOrderValue: ergebnis.code?.minOrderValue,
    }
  } catch (error) {
    throw errorResolver(error)
  }
})
