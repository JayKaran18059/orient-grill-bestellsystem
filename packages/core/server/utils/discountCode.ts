import type { Customer, DiscountCode } from '@nextorders/db'
import { prisma } from '@nextorders/db'
import { REWARD_DISCOUNT_PERCENT, REWARD_MIN_ORDER_VALUE } from './loyalty'

/** Wie lange ein Gutscheincode gilt */
export const CODE_VALID_DAYS = 90

/**
 * Zeichenvorrat für die Codes.
 *
 * Ohne 0/O und 1/I/L: Die Codes werden am Telefon durchgegeben und von
 * E-Mail abgetippt, da sind Verwechslungen sonst vorprogrammiert.
 */
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

function zufallsBlock(laenge: number): string {
  const werte = new Uint32Array(laenge)
  crypto.getRandomValues(werte)

  let block = ''
  for (const wert of werte) {
    block += ALPHABET[wert % ALPHABET.length]
  }
  return block
}

/** Erzeugt "ORIENT-A7K2-M9XQ" */
function neuerCode(): string {
  return `ORIENT-${zufallsBlock(4)}-${zufallsBlock(4)}`
}

/**
 * Legt einen Gutscheincode für einen Kunden an.
 *
 * Bei einer Kollision — statistisch praktisch ausgeschlossen, aber
 * nicht unmöglich — wird erneut gewürfelt statt die Belohnung
 * verfallen zu lassen.
 */
export async function createDiscountCodeForCustomer(
  customerId: Customer['id'],
): Promise<DiscountCode> {
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + CODE_VALID_DAYS)

  for (let versuch = 0; versuch < 5; versuch++) {
    try {
      return await prisma.discountCode.create({
        data: {
          code: neuerCode(),
          customerId,
          discountPercent: REWARD_DISCOUNT_PERCENT,
          minOrderValue: REWARD_MIN_ORDER_VALUE,
          expiresAt,
        },
      })
    } catch (error) {
      const istKollision
        = typeof error === 'object'
          && error !== null
          && 'code' in error
          && (error as { code?: string }).code === 'P2002'

      if (!istKollision || versuch === 4) {
        throw error
      }
    }
  }

  // Nur erreichbar, wenn die Schleife ohne Rückgabe endet
  throw new Error('Konnte keinen eindeutigen Gutscheincode erzeugen')
}

interface Pruefergebnis {
  ok: boolean
  grund?: 'unbekannt' | 'eingeloest' | 'abgelaufen' | 'mindestwert'
  code?: DiscountCode
}

/**
 * Prüft einen eingegebenen Code für einen bestimmten Kunden.
 *
 * Bewusst serverseitig und immer gegen die Datenbank — der Browser
 * darf weder über Gültigkeit noch über die Höhe des Rabatts
 * entscheiden.
 */
export async function pruefeDiscountCode(
  customerId: Customer['id'],
  eingabe: string,
  bestellwert: number,
): Promise<Pruefergebnis> {
  const code = await prisma.discountCode.findUnique({
    where: { code: eingabe.trim().toUpperCase() },
  })

  // Fremde Codes werden wie unbekannte behandelt: Sonst ließe sich
  // durch Ausprobieren herausfinden, welche Codes es überhaupt gibt.
  if (!code || code.customerId !== customerId) {
    return { ok: false, grund: 'unbekannt' }
  }
  if (code.redeemedAt) {
    return { ok: false, grund: 'eingeloest' }
  }
  if (code.expiresAt < new Date()) {
    return { ok: false, grund: 'abgelaufen' }
  }
  if (bestellwert < code.minOrderValue) {
    return { ok: false, grund: 'mindestwert', code }
  }

  return { ok: true, code }
}

/**
 * Entwertet einen Code.
 *
 * Die Bedingung `redeemedAt: null` steht bewusst in der Abfrage: So
 * kann derselbe Code nicht doppelt gebucht werden, wenn zwei
 * Bestellungen gleichzeitig abgeschlossen werden.
 */
export async function entwerteDiscountCode(
  codeId: string,
  orderId: string,
): Promise<boolean> {
  const ergebnis = await prisma.discountCode.updateMany({
    where: { id: codeId, redeemedAt: null },
    data: { redeemedAt: new Date(), redeemedOrderId: orderId },
  })

  return ergebnis.count === 1
}
