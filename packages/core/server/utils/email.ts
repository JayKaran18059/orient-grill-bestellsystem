/**
 * E-Mail-Versand über Resend.
 *
 * Absichtlich ohne zusätzliche Abhängigkeit: Resend hat eine schlichte
 * HTTP-Schnittstelle, ein `fetch` genügt.
 *
 * **Ohne hinterlegten Schlüssel wird nichts verschickt, sondern
 * protokolliert.** Das ist Absicht — die Bestellung soll nicht daran
 * scheitern, dass der Versand noch nicht eingerichtet ist. Der Gast
 * findet seinen Code ohnehin auch in seinem Konto.
 */

interface MailEingabe {
  an: string
  betreff: string
  text: string
  html: string
}

export async function sendeEmail({ an, betreff, text, html }: MailEingabe): Promise<boolean> {
  const { resendApiKey, mailAbsender } = useRuntimeConfig()

  if (!resendApiKey) {
    console.warn(
      `[E-Mail] Kein RESEND_API_KEY hinterlegt — Nachricht an ${an} wurde nicht verschickt. Betreff: "${betreff}"`,
    )
    return false
  }

  try {
    const antwort = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: mailAbsender || 'Orient Grill <onboarding@resend.dev>',
        to: [an],
        subject: betreff,
        text,
        html,
      }),
    })

    if (!antwort.ok) {
      const fehlertext = await antwort.text()
      console.error(`[E-Mail] Versand an ${an} fehlgeschlagen: ${antwort.status} ${fehlertext}`)
      return false
    }

    return true
  } catch (error) {
    console.error(`[E-Mail] Versand an ${an} fehlgeschlagen:`, error)
    return false
  }
}

/** Die Nachricht mit dem Gutscheincode. */
export function gutscheinNachricht(options: {
  code: string
  prozent: number
  mindestwert: number
  gueltigBis: Date
  shopUrl: string
}) {
  const { code, prozent, mindestwert, gueltigBis, shopUrl } = options
  const datum = gueltigBis.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

  const text = `Vielen Dank für Ihre Treue!

Sie haben fünf Bestellungen beim Orient Grill aufgegeben — dafür gibt es
${prozent} % Rabatt auf Ihre nächste Bestellung.

Ihr Gutscheincode: ${code}

Einzulösen bis zum ${datum}, ab ${mindestwert} € Bestellwert.
Geben Sie den Code beim Bestellabschluss ein: ${shopUrl}

Guten Appetit
Orient Grill, Margaretenstraße 27a, 18057 Rostock`

  const html = `<!doctype html>
<html lang="de">
<body style="margin:0;padding:24px;background:#0a0a0a;font-family:system-ui,-apple-system,sans-serif;color:#e7e5e2;">
  <table role="presentation" style="max-width:520px;margin:0 auto;background:#121212;border:1px solid #232323;border-radius:12px;">
    <tr><td style="padding:32px;">
      <p style="margin:0 0 8px;font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:#d4a95c;">Orient Grill Rostock</p>
      <h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#fafafa;">Vielen Dank für Ihre Treue!</h1>
      <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#a3a3a3;">
        Sie haben fünf Bestellungen bei uns aufgegeben — dafür gibt es
        <strong style="color:#e8c98a;">${prozent}&nbsp;% Rabatt</strong> auf Ihre nächste Bestellung.
      </p>

      <div style="margin:0 0 24px;padding:20px;text-align:center;background:#191919;border:1px dashed #b98c3e;border-radius:10px;">
        <p style="margin:0 0 6px;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#737373;">Ihr Gutscheincode</p>
        <p style="margin:0;font-size:26px;font-weight:700;letter-spacing:.06em;color:#e8c98a;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;">${code}</p>
      </div>

      <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#a3a3a3;">
        Einzulösen bis zum <strong style="color:#e7e5e2;">${datum}</strong>, ab ${mindestwert}&nbsp;€ Bestellwert.
      </p>

      <a href="${shopUrl}" style="display:inline-block;padding:14px 28px;background:#d4a95c;color:#0a0a0a;font-size:15px;font-weight:600;text-decoration:none;border-radius:999px;">
        Jetzt bestellen
      </a>

      <p style="margin:32px 0 0;padding-top:20px;border-top:1px solid #232323;font-size:12px;line-height:1.6;color:#737373;">
        Orient Grill, Margaretenstraße 27a, 18057 Rostock<br>
        Sie erhalten diese Nachricht, weil Sie ein Kundenkonto bei uns haben.
      </p>
    </td></tr>
  </table>
</body>
</html>`

  return { text, html }
}
