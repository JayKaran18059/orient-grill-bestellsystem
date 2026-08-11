import { prisma } from '@nextorders/db'

/**
 * Bestell-IDs des eingeloggten Kunden, kontoweit (nicht nur die
 * aktuelle Session) — aus den gespeicherten Belegen, neueste zuerst.
 *
 * Früher wurde das aus den Stempel-Ereignissen der Stempelkarte
 * abgeleitet. Das unterschlug jede Bestellung, für die es keinen
 * Stempel gab.
 */
export default defineEventHandler<Promise<string[]>>(async (event) => {
  const { user } = await getUserSession(event)
  if (!user?.customerId) {
    return []
  }

  const bestellungen = await prisma.order.findMany({
    // Angefangene, aber nie bezahlte Online-Bestellungen liegen als
    // Entwurf in der Tabelle. Die gehören nicht in die Historie.
    where: { customerId: user.customerId, status: { not: 'draft' } },
    orderBy: { createdAt: 'desc' },
    select: { id: true },
  })

  return bestellungen.map((bestellung) => bestellung.id)
})
