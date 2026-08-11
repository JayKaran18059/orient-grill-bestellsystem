import type { Order, OrderItem, OrderStatus, TimeType } from '@nextorders/food-schema'
import { prisma } from '@nextorders/db'

/**
 * Schreibt den bleibenden Beleg einer abgeschickten Bestellung.
 *
 * essence hält Bestellungen nur im Arbeitsspeicher und verliert sie bei
 * jedem Neustart. Ohne diesen Beleg gäbe es hinterher keinen Nachweis
 * mehr, dass überhaupt jemand bestellt hat.
 *
 * Schlägt das Schreiben fehl, wird die Bestellung trotzdem angenommen:
 * Solange erst bei der Abholung bezahlt wird, ist eine abgewiesene
 * Bestellung für den Laden schlimmer als ein fehlender Beleg. **Sobald
 * online im Voraus bezahlt wird, muss das umgekehrt werden** — dann
 * darf ohne gespeicherten Beleg kein Geld eingezogen werden.
 */
export async function speichereBestellung(order: Order, customerId?: string): Promise<boolean> {
  try {
    await prisma.order.create({
      data: {
        id: order.id,
        status: order.status,
        name: order.name,
        phone: order.phone,
        note: order.note || null,
        deliveryMethod: order.deliveryMethod,
        // Prisma kennt die Anschrift nur als JSON, der genaue Aufbau
        // hängt daran, ob abgeholt oder geliefert wird
        address: order.address as unknown as object,
        readyBy: order.readyBy || null,
        readyType: order.readyType || null,
        paymentMethodId: order.paymentMethodId,
        changeFrom: order.changeFrom ?? null,
        totalPrice: order.totalPrice,
        discountPercent: order.discountPercent ?? null,
        items: order.items as unknown as object[],
        customerId: customerId ?? null,
      },
    })

    return true
  } catch (error) {
    // Laut protokollieren, aber die Bestellung nicht daran scheitern
    // lassen — siehe Hinweis oben
    console.error(`[Bestellung] Beleg für ${order.id} konnte nicht gespeichert werden:`, error)

    return false
  }
}

/**
 * Holt eine Bestellung aus dem Beleg zurück.
 *
 * Wird gebraucht, wenn essence die Bestellung nicht mehr kennt — nach
 * einem Neustart ist das der Normalfall. Der Beleg ist eine
 * Momentaufnahme: Ein Zustandswechsel, den essence nach dem Bestellen
 * noch vorgenommen hat, steht nicht darin.
 */
export async function ladeBestellung(orderId: string): Promise<Order | null> {
  const beleg = await prisma.order.findUnique({ where: { id: orderId } })
  if (!beleg) {
    return null
  }

  return {
    id: beleg.id,
    status: beleg.status as OrderStatus,
    createdAt: beleg.createdAt.toISOString(),
    readyBy: beleg.readyBy ?? '',
    readyType: (beleg.readyType ?? 'asap') as TimeType,
    deliveryMethod: beleg.deliveryMethod as Order['deliveryMethod'],
    address: beleg.address as unknown as Order['address'],
    paymentMethodId: beleg.paymentMethodId,
    changeFrom: beleg.changeFrom ?? undefined,
    totalPrice: beleg.totalPrice,
    discountPercent: beleg.discountPercent ?? undefined,
    name: beleg.name,
    phone: beleg.phone,
    note: beleg.note ?? undefined,
    items: beleg.items as unknown as OrderItem[],
  }
}

/**
 * Gehört diese Bestellung zum angemeldeten Kunden? Gilt kontoweit,
 * also auch von einem anderen Gerät aus.
 */
export async function gehoertBestellungZuKunde(orderId: string, customerId: string): Promise<boolean> {
  const treffer = await prisma.order.findFirst({
    where: { id: orderId, customerId },
    select: { id: true },
  })

  return !!treffer
}
