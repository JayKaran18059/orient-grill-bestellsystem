import type { Order } from '@nextorders/food-schema'
import type { PaymentStatus } from './orderStorage'
import { entwerteDiscountCode, pruefeDiscountCode } from './discountCode'
import { awardStampForOrder } from './loyalty'

/**
 * Prüft den eingegebenen Gutscheincode und rechnet aus, was die
 * Bestellung am Ende kostet.
 *
 * Muss vor dem Anlegen der Zahlung und beim Abschluss dasselbe
 * Ergebnis liefern — sonst wird ein anderer Betrag eingezogen als
 * berechnet. Deshalb steht die Rechnung hier und nicht zweimal.
 *
 * Der Rabatt kommt ausschließlich aus der Datenbank. Was der Browser
 * an `discountPercent` mitschickt, ist ohne Bedeutung.
 */
export async function ermittleRechnung(optionen: {
  order: Order
  customerId?: string
  eingegebenerCode: string
}): Promise<{
  itemsTotal: number
  endbetrag: number
  discountPercent?: number
  gutschein?: { id: string, code: string }
}> {
  const { order, customerId, eingegebenerCode } = optionen

  const itemsTotal = order.items.reduce((summe, posten) => summe + posten.totalPrice, 0)

  const pruefung = customerId && eingegebenerCode
    ? await pruefeDiscountCode(customerId, eingegebenerCode, itemsTotal)
    : { ok: false as const }

  if (eingegebenerCode && !pruefung.ok) {
    throw createError({
      statusCode: 400,
      message: 'discount-code-invalid',
    })
  }

  if (!pruefung.ok) {
    return { itemsTotal, endbetrag: itemsTotal }
  }

  const discountPercent = pruefung.code.discountPercent

  return {
    itemsTotal,
    endbetrag: itemsTotal * (1 - discountPercent / 100),
    discountPercent,
    gutschein: { id: pruefung.code.id, code: pruefung.code.code },
  }
}

/**
 * Der endgültige Abschluss einer Bestellung, an einer Stelle.
 *
 * Er wird von zwei Seiten angestoßen: vom Gast, der die Kasse
 * abschickt, und — bei Online-Zahlung — vom Webhook, den Stripe
 * aufruft. Beide müssen dasselbe tun, sonst hängt an einer bezahlten
 * Bestellung mal ein Stempel und mal keiner.
 */
interface AbschlussOptionen {
  /** Entwurf, wie ihn essence kennt */
  order: Order
  /** Angaben aus dem Kassenformular (Name, Telefon, Notiz …) */
  daten: Partial<Order>
  customerId?: string
  /** Bereits geprüfter Rabatt — nie ungeprüft aus dem Browser übernehmen */
  discountPercent?: number
  gutschein?: { id: string, code: string }
  zahlung?: { status: PaymentStatus, stripePaymentId?: string }
}

export async function schliesseBestellungAb(optionen: AbschlussOptionen): Promise<Order> {
  const { order, daten, customerId, discountPercent, gutschein, zahlung } = optionen

  const abgeschlossen = await fetchApi({
    type: 'completeOrder',
    body: {
      ...order,
      ...daten,
      discountPercent,
    },
  })
  if (!abgeschlossen.result) {
    throw createError({
      statusCode: 404,
      message: 'Order not found',
    })
  }

  // Beleg schreiben, bevor irgendetwas anderes passiert. essence hält
  // die Bestellung ab hier nur im Arbeitsspeicher — der nächste
  // Neustart würde sie sonst spurlos verschlucken.
  await speichereBestellung(abgeschlossen.result, customerId, zahlung)

  // Code entwerten, sobald die Bestellung wirklich durch ist. Schlägt
  // das fehl (etwa weil derselbe Code parallel verbraucht wurde),
  // bleibt die Bestellung gültig — der Gast hat schließlich bestellt,
  // und ein doppelt gewährter Rabatt ist das kleinere Übel als eine
  // verlorene Bestellung.
  if (gutschein) {
    const entwertet = await entwerteDiscountCode(gutschein.id, abgeschlossen.result.id)
    if (!entwertet) {
      console.warn(`[Gutschein] Code ${gutschein.code} war bereits entwertet`)
    }
  }

  if (customerId) {
    await awardStampForOrder(customerId, abgeschlossen.result.id, !!gutschein)
  }

  return abgeschlossen.result
}

/**
 * Schließt eine online bezahlte Bestellung ab, nachdem Stripe die
 * Zahlung bestätigt hat.
 *
 * Wird von zwei Seiten aufgerufen: vom zurückkehrenden Browser, damit
 * der Gast sofort seine Bestätigung sieht, und vom Webhook, falls er
 * den Browser vorher geschlossen hat. Deshalb muss die Funktion
 * mehrfach aufrufbar sein, ohne doppelt zu wirken — dafür sorgt
 * `markiereBezahlt`: Nur der erste Aufruf trifft eine offene Zahlung
 * an, alle weiteren steigen hier aus.
 *
 * Der Zustand bei Stripe wird immer frisch abgefragt. Weder dem
 * Browser noch dem Inhalt der Webhook-Nachricht wird geglaubt, dass
 * bezahlt wurde.
 */
export async function finalisiereZahlung(stripePaymentId: string): Promise<{
  bezahlt: boolean
  orderId?: string
}> {
  const zahlung = await ladeZahlung(stripePaymentId)

  if (zahlung.status !== 'succeeded') {
    if (zahlung.status === 'canceled') {
      await markiereZahlungGescheitert(stripePaymentId)
    }

    return { bezahlt: false }
  }

  const { bestellung, warSchonBezahlt } = await markiereBezahlt(stripePaymentId)
  if (!bestellung) {
    // Geld eingenommen, aber kein Beleg dazu — das darf nicht
    // vorkommen und muss von Hand nachgesehen werden.
    console.error(`[Zahlung] Bezahlte Stripe-Zahlung ${stripePaymentId} ohne zugehörigen Beleg`)

    return { bezahlt: true }
  }

  if (warSchonBezahlt) {
    return { bezahlt: true, orderId: bestellung.id }
  }

  const customerId = zahlung.metadata?.customerId
  const gutscheinId = zahlung.metadata?.gutscheinId
  const gutscheinCode = zahlung.metadata?.gutscheinCode

  // Die Bestellung an die Küche durchreichen. essence kennt sie nur
  // dann noch, wenn es zwischenzeitlich nicht neu gestartet wurde —
  // scheitert es, bleibt der Beleg als bezahlte Bestellung bestehen
  // und muss von Hand in den Laden getragen werden.
  try {
    const entwurf = await fetchApi({ type: 'getOrder', body: { id: bestellung.id } })

    if (entwurf?.result && entwurf.result.status === 'draft') {
      await fetchApi({
        type: 'completeOrder',
        body: { ...entwurf.result, ...bestellung },
      })
    } else {
      console.error(`[Zahlung] Bezahlte Bestellung ${bestellung.id} liegt essence nicht mehr als Entwurf vor`)
    }
  } catch (error) {
    console.error(`[Zahlung] Bezahlte Bestellung ${bestellung.id} konnte nicht an essence übergeben werden:`, error)
  }

  if (gutscheinId) {
    const entwertet = await entwerteDiscountCode(gutscheinId, bestellung.id)
    if (!entwertet) {
      console.warn(`[Gutschein] Code ${gutscheinCode ?? gutscheinId} war bereits entwertet`)
    }
  }

  if (customerId) {
    await awardStampForOrder(customerId, bestellung.id, !!gutscheinId)
  }

  return { bezahlt: true, orderId: bestellung.id }
}

/**
 * Wird diese Zahlungsart im Voraus online bezahlt?
 *
 * Die Antwort steht in der Speisekarte des Betriebs, nicht im Code —
 * sonst müsste man beim Anlegen einer neuen Zahlungsart zwei Stellen
 * ändern und die zweite vergessen.
 */
export async function istOnlineZahlung(paymentMethodId: string): Promise<boolean> {
  if (!paymentMethodId) {
    return false
  }

  const channels = await fetchApi({ type: 'getChannels' })

  for (const channel of channels.result ?? []) {
    for (const art of [...(channel.selfPickup?.paymentMethods ?? []), ...(channel.deliveryByCourier?.paymentMethods ?? [])]) {
      if (art.id === paymentMethodId) {
        return art.type === 'online'
      }
    }
  }

  return false
}
