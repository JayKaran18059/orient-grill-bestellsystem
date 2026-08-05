import type { Customer } from '@nextorders/db'
import { prisma } from '@nextorders/db'

/** Nach jeweils 6 Stempeln gibt es eine neue Belohnung. */
export const STAMPS_PER_REWARD = 6
export const REWARD_DISCOUNT_PERCENT = 20
export const REWARD_MIN_ORDER_VALUE = 20

interface LoyaltyState {
  stampCount: number
  rewardAvailable: boolean
}

/** Reine Übergangsfunktion: nächster Zustand nach einem gesammelten Stempel. */
export function nextLoyaltyState(current: LoyaltyState): { state: LoyaltyState, rewardJustEarned: boolean } {
  const stampCount = current.stampCount + 1

  if (stampCount >= STAMPS_PER_REWARD) {
    return {
      state: { stampCount: 0, rewardAvailable: true },
      rewardJustEarned: true,
    }
  }

  return {
    state: { stampCount, rewardAvailable: current.rewardAvailable },
    rewardJustEarned: false,
  }
}

/** Reicht die Warensumme (vor Rabatt) und ein verfügbares Guthaben für den Treuerabatt? */
export function isDiscountEligible(rewardAvailable: boolean, orderTotalBeforeDiscount: number): boolean {
  return rewardAvailable && orderTotalBeforeDiscount >= REWARD_MIN_ORDER_VALUE
}

/**
 * Nach einer erfolgreich abgeschlossenen Bestellung aufrufen: vergibt
 * einen Stempel und bucht eine ggf. in dieser Bestellung eingelöste
 * Belohnung aus. `rewardWasRedeemed` muss anhand der tatsächlich
 * abgerechneten Bestellung ermittelt werden (siehe complete.post.ts),
 * nicht aus Client-Angaben.
 */
export async function awardStampForOrder(
  customerId: Customer['id'],
  orderId: string,
  rewardWasRedeemed: boolean,
): Promise<{ stampCount: number, rewardAvailable: boolean, rewardJustEarned: boolean }> {
  const customer = await prisma.customer.findUniqueOrThrow({ where: { id: customerId } })

  const events: { customerId: string, orderId: string, type: 'stamp' | 'rewardEarned' | 'rewardRedeemed' }[] = []

  let rewardAvailable = customer.rewardAvailable
  if (rewardWasRedeemed && rewardAvailable) {
    rewardAvailable = false
    events.push({ customerId, orderId, type: 'rewardRedeemed' })
  }

  const { state, rewardJustEarned } = nextLoyaltyState({ stampCount: customer.stampCount, rewardAvailable })
  events.push({ customerId, orderId, type: 'stamp' })
  if (rewardJustEarned) {
    events.push({ customerId, orderId, type: 'rewardEarned' })
  }

  await prisma.$transaction([
    prisma.customer.update({
      where: { id: customerId },
      data: { stampCount: state.stampCount, rewardAvailable: state.rewardAvailable },
    }),
    prisma.loyaltyEvent.createMany({ data: events }),
  ])

  return { ...state, rewardJustEarned }
}
