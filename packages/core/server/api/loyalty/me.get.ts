import { prisma } from '@nextorders/db'
import { STAMPS_PER_REWARD } from '../../utils/loyalty'

export default defineEventHandler(async (event) => {
  const { user } = await getUserSession(event)
  if (!user?.customerId) {
    return null
  }

  const customer = await prisma.customer.findUnique({
    where: { id: user.customerId },
    select: { stampCount: true, rewardAvailable: true },
  })
  if (!customer) {
    return null
  }

  return {
    stampCount: customer.stampCount,
    stampsPerReward: STAMPS_PER_REWARD,
    rewardAvailable: customer.rewardAvailable,
  }
})
