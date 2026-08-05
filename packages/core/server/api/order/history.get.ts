import { prisma } from '@nextorders/db'

/**
 * Bestell-IDs des eingeloggten Kunden, kontoweit (nicht nur die
 * aktuelle Session) — ermittelt aus den Stempel-Ereignissen der
 * Stempelkarte, da essence Bestellungen nicht dauerhaft speichert.
 */
export default defineEventHandler<Promise<string[]>>(async (event) => {
  const { user } = await getUserSession(event)
  if (!user?.customerId) {
    return []
  }

  const events = await prisma.loyaltyEvent.findMany({
    where: { customerId: user.customerId, type: 'stamp' },
    orderBy: { createdAt: 'desc' },
    select: { orderId: true },
  })

  return events.map((event) => event.orderId)
})
