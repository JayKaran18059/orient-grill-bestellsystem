/**
 * Lädt Stripe.js nach.
 *
 * Das Skript muss von `js.stripe.com` kommen und darf nicht mitgeliefert
 * werden — Stripe verlangt das, weil nur so Sicherheitskorrekturen sofort
 * bei allen ankommen. Deshalb auch kein npm-Paket: `@stripe/stripe-js`
 * wäre bloß ein Mantel um genau dieses Nachladen.
 *
 * Geladen wird erst, wenn jemand wirklich online bezahlen will. Wer bar
 * bei Abholung wählt, holt sich kein fremdes Skript in den Browser.
 */

/** Nur die Teile von Stripe.js, die hier gebraucht werden. */
export interface StripeElement {
  mount: (ziel: HTMLElement) => void
  unmount: () => void
  destroy: () => void
  on: (ereignis: string, rueckruf: (daten?: unknown) => void) => void
}

export interface StripeElements {
  create: (art: string, optionen?: Record<string, unknown>) => StripeElement
  fetchUpdates: () => Promise<{ error?: { message?: string } }>
  submit: () => Promise<{ error?: { message?: string } }>
}

export interface StripeInstanz {
  elements: (optionen: Record<string, unknown>) => StripeElements
  confirmPayment: (optionen: Record<string, unknown>) => Promise<{
    error?: { message?: string, type?: string }
    paymentIntent?: { id: string, status: string }
  }>
}

declare global {
  interface Window {
    Stripe?: (schluessel: string, optionen?: Record<string, unknown>) => StripeInstanz
  }
}

const SKRIPT_URL = 'https://js.stripe.com/v3/'

/** Das Nachladen läuft nur einmal, egal wie oft danach gefragt wird. */
let ladevorgang: Promise<StripeInstanz | null> | null = null

export async function ladeStripe(schluessel: string): Promise<StripeInstanz | null> {
  if (!schluessel || import.meta.server) {
    return null
  }

  ladevorgang ??= new Promise<StripeInstanz | null>((fertig) => {
    if (window.Stripe) {
      fertig(window.Stripe(schluessel, { locale: 'de' }))
      return
    }

    const vorhanden = document.querySelector<HTMLScriptElement>(`script[src="${SKRIPT_URL}"]`)
    const skript = vorhanden ?? document.createElement('script')

    skript.addEventListener('load', () => {
      fertig(window.Stripe ? window.Stripe(schluessel, { locale: 'de' }) : null)
    })
    skript.addEventListener('error', () => {
      // Nächster Versuch darf es erneut probieren — vielleicht war nur
      // das Netz kurz weg
      ladevorgang = null
      fertig(null)
    })

    if (!vorhanden) {
      skript.src = SKRIPT_URL
      skript.async = true
      document.head.appendChild(skript)
    }
  })

  return ladevorgang
}
