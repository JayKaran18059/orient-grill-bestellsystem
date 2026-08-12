import { createId } from '@paralleldrive/cuid2'
import { finalisiereZahlung } from '../../utils/orderCompletion'

/**
 * Wird aufgerufen, wenn der Gast von der Stripe-Bezahlseite
 * zurückkommt.
 *
 * Ob wirklich bezahlt wurde, wird bei Stripe erfragt — nicht daran
 * abgelesen, dass der Browser diese Adresse aufgerufen hat. Sonst käme
 * jeder mit einer selbst getippten Adresse zu einer bezahlten
 * Bestellung.
 */
export default defineEventHandler(async (event) => {
  try {
    if (!istStripeEingerichtet()) {
      throw createError({
        statusCode: 503,
        message: 'payment-not-configured',
      })
    }

    const body = await readBody(event)
    const zahlungId = typeof body?.zahlungId === 'string' ? body.zahlungId : ''

    if (!zahlungId) {
      throw createError({
        statusCode: 400,
        message: 'payment-missing',
      })
    }

    const ergebnis = await finalisiereZahlung(zahlungId)

    if (!ergebnis.bezahlt || !ergebnis.orderId) {
      throw createError({
        statusCode: 402,
        message: 'payment-not-completed',
      })
    }

    // Warenkorb leeren und die Bestellung dem Browser zuordnen, damit
    // die Bestätigungsseite sie abrufen darf.
    const { user } = await getUserSession(event)
    await replaceUserSession(event, {
      user: {
        ...user,
        id: user?.id || createId(),
        orderId: undefined,
        completedOrderIds: [...(user?.completedOrderIds || []), ergebnis.orderId],
      },
    })

    return { orderId: ergebnis.orderId }
  } catch (error) {
    throw errorResolver(error)
  }
})
