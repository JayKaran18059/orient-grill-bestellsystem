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
 * Bezahlt wird auf einer von Stripe gehosteten Seite („Checkout"), nicht
 * in einem eingebetteten Feld. Welche Methoden dort erscheinen — Karte,
 * Apple Pay, Google Pay, PayPal — stellt man im Stripe-Dashboard ein;
 * hier ist dafür nichts zu ändern. Das hält Kartendaten vollständig aus
 * diesem Projekt heraus.
 *
 * **Ohne hinterlegten Schlüssel ist Online-Zahlung schlicht aus.** Die
 * Bezahlart verschwindet dann aus der Kasse und es bleibt beim Bezahlen
 * vor Ort.
 */

const STRIPE_API = 'https://api.stripe.com/v1'

/** Bezahlseite bei Stripe, reduziert auf das hier Gebrauchte */
export interface StripeKasse {
  id: string
  url?: string
  /** 'paid', 'unpaid' oder 'no_payment_required' */
  payment_status: string
  /** 'open', 'complete' oder 'expired' */
  status: string
  amount_total: number
  currency: string
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
 * Legt die Bezahlseite an und gibt sie samt Adresse zurück.
 *
 * Der Betrag kommt ausschließlich von hier, aus der Bestellung auf dem
 * Server. Ein aus dem Browser mitgeschickter Betrag wäre wertlos, weil
 * ihn jeder ändern könnte.
 *
 * Die ganze Bestellung wird als **eine** Position übergeben. Stripe
 * bräuchte sonst für jedes Extra eine eigene Zeile, und die Summe müsste
 * an zwei Stellen stimmen. Was genau bestellt wurde, steht ohnehin im
 * Beleg in der eigenen Datenbank.
 */
export async function erstelleKassenSitzung(optionen: {
  betrag: number
  orderId: string
  beschreibung: string
  erfolgUrl: string
  abbruchUrl: string
  /** Wird bei Stripe hinterlegt und beim Abschluss wieder ausgelesen */
  merkmale?: Record<string, string>
}): Promise<StripeKasse> {
  const { betrag, orderId, beschreibung, erfolgUrl, abbruchUrl, merkmale } = optionen

  const daten: Record<string, string> = {
    'mode': 'payment',
    'success_url': erfolgUrl,
    'cancel_url': abbruchUrl,
    'line_items[0][quantity]': '1',
    'line_items[0][price_data][currency]': 'eur',
    'line_items[0][price_data][unit_amount]': String(inCent(betrag)),
    'line_items[0][price_data][product_data][name]': beschreibung,
    'metadata[orderId]': orderId,
  }

  for (const [schluessel, wert] of Object.entries(merkmale ?? {})) {
    if (wert) {
      daten[`metadata[${schluessel}]`] = wert
    }
  }

  return stripeAnfrage<StripeKasse>('/checkout/sessions', daten)
}

/** Fragt bei Stripe nach, wie es um eine Bezahlseite steht. */
export async function ladeKassenSitzung(sitzungId: string): Promise<StripeKasse> {
  return stripeAnfrage<StripeKasse>(`/checkout/sessions/${encodeURIComponent(sitzungId)}`)
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
