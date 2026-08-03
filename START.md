# Orient Grill — Bestellsystem starten

Kurzanleitung. Alles läuft auf deinem Rechner, nichts davon ist online.

## Beim ersten Mal

Einmalig, nach dem Herunterladen des Projekts:

```bash
pnpm install
pnpm --filter @nextorders/food-schema build
```

Der zweite Befehl ist wichtig: Ohne ihn startet das Backend nicht.

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
