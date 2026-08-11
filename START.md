# Orient Grill — Bestellsystem starten

Kurzanleitung. Alles läuft auf deinem Rechner, nichts davon ist online.

## Beim ersten Mal

Einmalig, nach dem Herunterladen des Projekts:

```bash
pnpm install
pnpm --filter @nextorders/food-schema build
pnpm --filter @nextorders/db build
```

Der zweite Befehl ist wichtig: Ohne ihn startet das Backend nicht.
Der dritte Befehl erzeugt den Datenbank-Client für Kundenkonten und die
Stempelkarte — dafür muss vorher `DATABASE_URL` in `apps/web-app/.env`
gesetzt sein (siehe „Kundenkonto & Stempelkarte" unten).

## Kundenkonto & Stempelkarte — einmalige Einrichtung

Diese Funktion braucht drei zusätzliche Angaben in `apps/web-app/.env`
(Vorlage in `apps/web-app/.env.example`):

1. **`DATABASE_URL`** — Postgres-Datenbank (empfohlen: Vercel Postgres/Neon,
   im Vercel-Dashboard des Projekts anlegen, Verbindungsstring kopieren).
2. **`NUXT_OAUTH_GOOGLE_CLIENT_ID`** / **`NUXT_OAUTH_GOOGLE_CLIENT_SECRET`** —
   aus der Google Cloud Console (OAuth-Client vom Typ "Web-Anwendung").
   Als Redirect-URI eintragen: `http://localhost:3502/api/auth/google`
   (lokal) bzw. `https://<domain>/api/auth/google` (Produktion).

Sobald `DATABASE_URL` gesetzt ist, einmalig die Datenbank-Tabellen anlegen:

```bash
pnpm --filter @nextorders/db run prisma:migrate:dev
```

`NUXT_SESSION_PASSWORD` ist bereits vorbelegt (siehe `apps/web-app/.env`) —
für die Produktivumgebung auf Vercel muss derselbe Wert (oder ein neuer,
zufälliger String mit mindestens 32 Zeichen) dort ebenfalls als
Umgebungsvariable hinterlegt werden.

## Online bezahlen — einmalige Einrichtung

Ohne die folgenden Angaben zeigt die Kasse nur „Barzahlung bei
Abholung" und „Kartenzahlung bei Abholung". Alles andere funktioniert
ganz normal weiter.

1. Konto bei **stripe.com** anlegen. Zum Ausprobieren reicht das
   frische Konto — echtes Geld auszahlen lassen geht erst nach der
   Verifizierung (Gewerbe, Bankverbindung, Ausweis).
2. Im Dashboard unter **Entwickler → API-Schlüssel** die beiden
   Testschlüssel kopieren und in `apps/web-app/.env` eintragen:
   `NUXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (pk_test_…) und
   `NUXT_STRIPE_SECRET_KEY` (sk_test_…).
3. Unter **Entwickler → Webhooks** einen Endpunkt anlegen:
   Adresse `<deine Domain>/api/payment/webhook`, Ereignis
   `checkout.session.completed`. Das dort angezeigte Geheimnis
   (whsec_…) kommt nach `NUXT_STRIPE_WEBHOOK_SECRET`.
4. Unter **Einstellungen → Zahlungsmethoden** einschalten, was
   angeboten werden soll: Karte, Apple Pay, Google Pay, PayPal. Was
   dort aktiv ist, erscheint beim Bezahlen — im Code ist dafür nichts
   zu ändern.
5. Für Apple Pay zusätzlich die Domain freischalten (Einstellungen →
   Zahlungsmethoden → Apple Pay). Das geht nur mit einer echten
   Domain, nicht mit localhost.

**Zum Testen:** Kartennummer `4242 4242 4242 4242`, ein beliebiges
Ablaufdatum in der Zukunft, beliebige Prüfziffer. Es wird nichts
abgebucht. Die Zahlungen erscheinen im Stripe-Dashboard.

**Wichtig:** Der geheime Schlüssel gehört in die `.env` und zu Vercel,
niemals in eine Datei im Projekt und niemals in einen Commit. Wer ihn
hat, kann Geld von deinem Konto bewegen.

Für den Livegang die Testschlüssel gegen die echten tauschen — und
denselben Satz Werte bei Vercel als Umgebungsvariablen hinterlegen,
sonst gilt er nur auf deinem Rechner.

## Jedes Mal

Du brauchst **zwei Terminal-Fenster**, in beiden Fällen im
Projektordner. Sie müssen gleichzeitig laufen.

**Fenster 1 — Backend (die Speisekarte):**

```bash
pnpm --filter @nextorders/essence dev
```

**Fenster 2 — die Website:**

```bash
pnpm --filter @nextorders/web-app dev
```

Dann im Browser öffnen: **http://localhost:3502**

Der erste Aufruf dauert etwa eine Minute — es wird im Hintergrund
gebaut. Danach geht es schnell.

Zum Beenden in beiden Fenstern `Strg + C` drücken.

## Wenn etwas klemmt

**„Port bereits belegt" oder alte Daten werden angezeigt:**
Wahrscheinlich läuft noch ein alter Prozess. Beenden mit:

```bash
pkill -f "nuxt.mjs dev"
```

Danach beide Fenster neu starten.

**Änderungen kommen nicht an:** Im Browser einmal hart neu laden —
`Cmd + Shift + R` auf dem Mac.

**Farben oder Schriften ändern sich nicht — trotz Neustart:**
Das ist die häufigste Stolperfalle. Die Grundeinstellungen aus
`options.ts` (Farben, Schriften, Währung, Sprache) werden **fünf
Minuten lang zwischengespeichert**. Entweder warten, oder:

```bash
pkill -f "nuxt.mjs dev"
rm -rf apps/web-app/.nuxt/cache
```

Danach beide Fenster neu starten. Gerichte und Preise sind davon
nicht betroffen — die erscheinen sofort.

## Was wo gepflegt wird

| Was | Datei |
|---|---|
| Gerichte und Preise | `apps/essence/server/services/data/products/` |
| Kategorien und Reihenfolge | `apps/essence/server/services/menu.ts` |
| Adresse, Öffnungszeiten, Zahlungsarten | `apps/essence/server/services/channel.ts` |
| Sprache, Währung, Markenfarbe | `apps/essence/server/services/options.ts` |

Eine Preisänderung sieht zum Beispiel so aus — in
`data/products/doener.ts`:

```text
gericht({ nr: 1, name: 'Döner Kebap im Brot', beschreibung: beilage, preis: 7.0 }),
```

Nur die Zahl hinter `preis:` ändern, speichern, fertig. Der Server
übernimmt es sofort.

## Wichtig zu wissen

**Dieses Backend ist eine Demo.** „Essence" speichert Bestellungen nur
im Arbeitsspeicher — **nach jedem Neustart sind sie weg**. Zum
Ausprobieren ist das ideal, für einen echten Laden mit echten
Bestellungen braucht es ein richtiges Backend mit Datenbank.
