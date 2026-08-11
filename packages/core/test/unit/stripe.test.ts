import { createHmac } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { inCent, pruefeWebhookSignatur } from '../../server/utils/stripe'

const GEHEIMNIS = 'whsec_testgeheimnis'
const JETZT = 1_760_000_000

function signiere(koerper: string, zeitstempel = JETZT, geheimnis = GEHEIMNIS): string {
  const signatur = createHmac('sha256', geheimnis)
    .update(`${zeitstempel}.${koerper}`)
    .digest('hex')

  return `t=${zeitstempel},v1=${signatur}`
}

describe('inCent', () => {
  it('rechnet Euro in Cent um', () => {
    expect(inCent(8.5)).toBe(850)
    expect(inCent(7)).toBe(700)
  })

  it('rundet Fließkomma-Ungenauigkeiten weg statt abzuschneiden', () => {
    // 16.15 liegt binär minimal unter dem echten Wert. Abschneiden
    // ergäbe 1614 — einen Cent zu wenig.
    expect(inCent(16.15)).toBe(1615)
    expect(inCent(0.1 + 0.2)).toBe(30)
  })
})

describe('pruefeWebhookSignatur', () => {
  const koerper = JSON.stringify({ type: 'checkout.session.completed' })

  it('nimmt eine gültige Signatur an', () => {
    expect(pruefeWebhookSignatur({
      koerper,
      signaturKopf: signiere(koerper),
      geheimnis: GEHEIMNIS,
      jetzt: JETZT,
    })).toBe(true)
  })

  it('weist ein falsches Geheimnis ab', () => {
    expect(pruefeWebhookSignatur({
      koerper,
      signaturKopf: signiere(koerper, JETZT, 'whsec_falsch'),
      geheimnis: GEHEIMNIS,
      jetzt: JETZT,
    })).toBe(false)
  })

  it('weist einen veränderten Körper ab', () => {
    const signaturKopf = signiere(koerper)

    expect(pruefeWebhookSignatur({
      koerper: JSON.stringify({ type: 'checkout.session.completed', betrag: 1 }),
      signaturKopf,
      geheimnis: GEHEIMNIS,
      jetzt: JETZT,
    })).toBe(false)
  })

  it('weist eine zu alte Nachricht ab, damit sie nicht erneut eingespielt werden kann', () => {
    expect(pruefeWebhookSignatur({
      koerper,
      signaturKopf: signiere(koerper, JETZT - 3600),
      geheimnis: GEHEIMNIS,
      jetzt: JETZT,
    })).toBe(false)
  })

  it('nimmt eine Nachricht innerhalb der Toleranz an', () => {
    expect(pruefeWebhookSignatur({
      koerper,
      signaturKopf: signiere(koerper, JETZT - 60),
      geheimnis: GEHEIMNIS,
      jetzt: JETZT,
    })).toBe(true)
  })

  it('weist fehlende oder unbrauchbare Kopfzeilen ab', () => {
    for (const signaturKopf of ['', 'unsinn', 't=1', `v1=${'a'.repeat(64)}`]) {
      expect(pruefeWebhookSignatur({
        koerper,
        signaturKopf,
        geheimnis: GEHEIMNIS,
        jetzt: JETZT,
      })).toBe(false)
    }
  })

  it('weist ab, wenn gar kein Geheimnis hinterlegt ist', () => {
    expect(pruefeWebhookSignatur({
      koerper,
      signaturKopf: signiere(koerper),
      geheimnis: '',
      jetzt: JETZT,
    })).toBe(false)
  })

  it('kommt mit mehreren Signaturen im Kopf zurecht, wie beim Wechsel des Geheimnisses', () => {
    const gueltig = createHmac('sha256', GEHEIMNIS).update(`${JETZT}.${koerper}`).digest('hex')

    expect(pruefeWebhookSignatur({
      koerper,
      signaturKopf: `t=${JETZT},v1=${'0'.repeat(64)},v1=${gueltig}`,
      geheimnis: GEHEIMNIS,
      jetzt: JETZT,
    })).toBe(true)
  })
})
