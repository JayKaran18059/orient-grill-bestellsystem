import { Buffer } from 'node:buffer'
import { createHmac, timingSafeEqual } from 'node:crypto'

/**
 * Anbindung an Stripe.
 *
 * Absichtlich ohne das Stripe-SDK: Für das Wenige, was gebraucht wird —
 * eine Bezahlseite anlegen, sie nachschlagen, eine Webhook-Signatur
 * prüfen — genügt die HTTP-Schnittstelle. Dieselbe Linie wie beim
 * E-Mail-Versand in `email.ts`.
 *
 * Bezahlt wird in einem Feld direkt in der Kasse. Apple Pay, Google Pay
 * und PayPal erscheinen dort als eigene Schaltflächen, die Karte als
 * Eingabefeld darunter. Die Kartennummer wandert dabei in einen von
 * Stripe gestellten Rahmen und berührt dieses Projekt nie.
 *
 * Welche Methoden angeboten werden, stellt der Wirt im Stripe-Dashboard
 * ein; hier ist dafür nichts zu ändern.
 *
 * **Ohne hinterlegten Schlüssel ist Online-Zahlung schlicht aus.** Die
 * Bezahlart verschwindet dann aus der Kasse und es bleibt beim Bezahlen
 * vor Ort.
 */

const STRIPE_API = 'https://api.stripe.com/v1'

/** Zahlung bei Stripe, reduziert auf das hier Gebrauchte */
export interface StripeZahlung {
  id: string
  /** 'succeeded', 'requires_payment_method', 'canceled' … */
  status: string
  amount: number
  currency: string
  client_secret?: string
  metadata?: Record<string, string>
}

export function istStripeEingerichtet(): boolean {
  const { stripeSecretKey } = useRuntimeConfig()

  return !!stripeSecretKey
}

/**
 * Euro-Betrag in Cent, kaufmännisch gerundet.
 *
 * Stripe rechnet ausschließlich in der kleinsten Währungseinheit. Ein
 * Fließkommabetrag wie 15.999999 ergäbe abgeschnitten einen Cent zu
 * wenig.
 */
export function inCent(betrag: number): number {
  return Math.round(betrag * 100)
}

async function stripeAnfrage<T>(pfad: string, daten?: Record<string, string>): Promise<T> {
  const { stripeSecretKey } = useRuntimeConfig()
  if (!stripeSecretKey) {
    throw new Error('Stripe ist nicht eingerichtet')
  }

  const antwort = await fetch(`${STRIPE_API}${pfad}`, {
    method: daten ? 'POST' : 'GET',
    headers: {
      'Authorization': `Bearer ${stripeSecretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: daten ? new URLSearchParams(daten).toString() : undefined,
  })

  const inhalt = await antwort.json() as T & { error?: { message?: string } }

  if (!antwort.ok) {
    throw new Error(`Stripe ${antwort.status}: ${inhalt?.error?.message ?? 'unbekannter Fehler'}`)
  }

  return inhalt
}

/**
 * Legt eine Zahlung an und gibt sie samt `client_secret` zurück. Mit
 * diesem Geheimnis baut der Browser das Bezahlfeld auf.
 *
 * Der Betrag kommt ausschließlich von hier, aus der Bestellung auf dem
 * Server. Ein aus dem Browser mitgeschickter Betrag wäre wertlos, weil
 * ihn jeder ändern könnte.
 */
export async function erstelleZahlung(optionen: {
  betrag: number
  orderId: string
  beschreibung: string
  /** Wird bei Stripe hinterlegt und beim Abschluss wieder ausgelesen */
  merkmale?: Record<string, string>
}): Promise<StripeZahlung> {
  const { betrag, orderId, beschreibung, merkmale } = optionen

  const daten: Record<string, string> = {
    'amount': String(inCent(betrag)),
    'currency': 'eur',
    'description': beschreibung,
    // Stripe entscheidet anhand der Einstellungen im Dashboard, welche
    // Methoden das Bezahlfeld anbietet
    'automatic_payment_methods[enabled]': 'true',
    'metadata[orderId]': orderId,
  }

  for (const [schluessel, wert] of Object.entries(merkmale ?? {})) {
    if (wert) {
      daten[`metadata[${schluessel}]`] = wert
    }
  }

  return stripeAnfrage<StripeZahlung>('/payment_intents', daten)
}

/**
 * Setzt den Betrag einer noch offenen Zahlung neu.
 *
 * Nötig, wenn der Gast den Warenkorb ändert, nachdem das Bezahlfeld
 * schon aufgebaut ist. Ohne das würde der alte Betrag eingezogen.
 */
export async function aktualisiereZahlungsbetrag(zahlungId: string, betrag: number): Promise<StripeZahlung> {
  return stripeAnfrage<StripeZahlung>(`/payment_intents/${encodeURIComponent(zahlungId)}`, {
    amount: String(inCent(betrag)),
  })
}

/** Fragt bei Stripe nach, wie es um eine Zahlung steht. */
export async function ladeZahlung(zahlungId: string): Promise<StripeZahlung> {
  return stripeAnfrage<StripeZahlung>(`/payment_intents/${encodeURIComponent(zahlungId)}`)
}

/**
 * Prüft die Signatur eines Stripe-Webhooks.
 *
 * Ohne diese Prüfung könnte jeder eine Nachricht „bezahlt" an die
 * Adresse schicken und sich damit kostenlos Essen bestellen.
 *
 * Stripe schickt den Kopf `Stripe-Signature` in der Form
 * `t=<Zeitstempel>,v1=<Signatur>`. Signiert wird `<Zeitstempel>.<Körper>`
 * mit dem Webhook-Geheimnis.
 *
 * `toleranzSekunden` legt fest, wie alt eine Nachricht höchstens sein
 * darf. Das schützt davor, dass jemand eine echte, mitgeschnittene
 * Nachricht später erneut einspielt.
 */
export function pruefeWebhookSignatur(optionen: {
  koerper: string
  signaturKopf: string
  geheimnis: string
  toleranzSekunden?: number
  jetzt?: number
}): boolean {
  const { koerper, signaturKopf, geheimnis, toleranzSekunden = 300 } = optionen
  const jetzt = optionen.jetzt ?? Math.floor(Date.now() / 1000)

  if (!koerper || !signaturKopf || !geheimnis) {
    return false
  }

  let zeitstempel = ''
  const signaturen: string[] = []

  for (const teil of signaturKopf.split(',')) {
    const [schluessel, wert] = teil.trim().split('=')
    if (schluessel === 't' && wert) {
      zeitstempel = wert
    }
    if (schluessel === 'v1' && wert) {
      signaturen.push(wert)
    }
  }

  if (!zeitstempel || signaturen.length === 0) {
    return false
  }

  const alter = jetzt - Number(zeitstempel)
  if (!Number.isFinite(alter) || Math.abs(alter) > toleranzSekunden) {
    return false
  }

  const erwartet = createHmac('sha256', geheimnis)
    .update(`${zeitstempel}.${koerper}`)
    .digest('hex')

  // Zeitkonstant vergleichen, damit sich die Signatur nicht durch Messen
  // der Antwortzeit Zeichen für Zeichen erraten lässt
  return signaturen.some((signatur) => {
    if (signatur.length !== erwartet.length) {
      return false
    }

    return timingSafeEqual(Buffer.from(signatur), Buffer.from(erwartet))
  })
}
