import { prisma } from '@nextorders/db'

/**
 * Die Gutscheincodes des angemeldeten Kunden.
 *
 * Damit findet er seinen Code auch dann, wenn die E-Mail im Spam
 * gelandet ist oder der Versand noch gar nicht eingerichtet wurde.
 */
export default defineEventHandler(async (event) => {
  const { user } = await getUserSession(event)
  if (!user?.customerId) {
    return []
  }

  const codes = await prisma.discountCode.findMany({
    where: { customerId: user.customerId },
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: {
      code: true,
      discountPercent: true,
      minOrderValue: true,
      expiresAt: true,
      redeemedAt: true,
    },
  })

  const jetzt = new Date()

  return codes.map((code) => ({
    ...code,
    status: code.redeemedAt
      ? ('redeemed' as const)
      : code.expiresAt < jetzt
        ? ('expired' as const)
        : ('active' as const),
  }))
})
