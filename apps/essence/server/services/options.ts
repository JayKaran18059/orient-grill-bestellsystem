import type { GatewayGetOptionsResponse, Options } from '@nextorders/food-schema'

// Grundeinstellungen des Shops.
//
// Bewusst nur Deutsch: `availableLocales` bestimmt, welche Sprachen die
// Oberfläche anbietet. Steht hier nur 'de', reicht es, Texte auch nur
// auf Deutsch zu pflegen — das spart in den Produktdaten zehn
// Übersetzungen je Eintrag.

const options: Options = {
  selectorTitle: [
    {
      locale: 'de',
      value: 'Orient Grill Rostock',
    },
  ],
  selectorDescription: [
    {
      locale: 'de',
      value: 'Döner frisch vom Spieß, Pizza aus dem Ofen und türkische Spezialitäten — mitten in Rostock.',
    },
  ],

  // Noch kein eigenes Logo hinterlegt. Sobald eines vorliegt, hier die
  // Adresse eintragen.
  logoUrl: '',

  defaultLocale: 'de',
  availableLocales: ['de'],
  countryCode: 'DE',
  currencyCode: 'EUR',

  headLinks: [],

  // Das gesamte Erscheinungsbild wird hier eingeschleust. Bewusst über
  // `headStyles` statt in den Dateien der Vorlage — so bleibt das
  // Projekt aktualisierbar, ohne dass Anpassungen verlorengehen.
  //
  // Vorbild ist die Schaufenster-Seite: Schwarz, Gold, Playfair für
  // Überschriften, Inter für Fließtext.
  headStyles: [
    `
    /* ---------- Schriften, selbst gehostet ---------- */
    @font-face {
      font-family: 'Playfair Display Variable';
      font-style: normal;
      font-display: swap;
      font-weight: 400 900;
      src: url('/schriften/playfair.woff2') format('woff2-variations');
    }
    @font-face {
      font-family: 'Inter Variable';
      font-style: normal;
      font-display: swap;
      font-weight: 100 900;
      src: url('/schriften/inter.woff2') format('woff2-variations');
    }

    :root {
      --font-serif: 'Playfair Display Variable', Georgia, serif !important;
      --font-sans: 'Inter Variable', system-ui, sans-serif !important;

      --gold-400: #e8c98a;
      --gold-500: #d4a95c;
      --gold-600: #b98c3e;

      --ui-radius: 0.75rem;
    }

    /* ---------- Farbwelt ---------- */
    /* Die Oberfläche läuft im dunklen Modus, deshalb dort ansetzen.
       Bewusst \`html.dark\` statt nur \`.dark\`: Die Vorlage setzt
       --ui-primary selbst auf Weiß, und die höhere Spezifität
       gewinnt unabhängig davon, welche Datei zuletzt geladen wird. */
    html.dark {
      --ui-primary: #d4a95c;
      --ui-secondary: #d4a95c;

      --ui-bg: #0a0a0a;
      --ui-bg-muted: #121212;
      --ui-bg-elevated: #191919;
      --ui-bg-accented: #232323;

      --ui-text: #e7e5e2;
      --ui-text-muted: #a3a3a3;
      --ui-text-dimmed: #737373;
      --ui-text-highlighted: #fafafa;

      --ui-border: #232323;
      --ui-border-muted: #191919;
      --ui-border-accented: #333333;
    }

    body {
      background-color: #0a0a0a;
      -webkit-font-smoothing: antialiased;
    }

    /* ---------- Typografie ---------- */
    h1, h2, h3, .font-serif {
      letter-spacing: -0.01em;
    }

    /* Preise und Mengen in Versalziffern: Playfair setzt sonst
       Mediävalziffern, dann sitzt die 0 in "7,00" unter der Linie. */
    .font-serif, h1, h2, h3 {
      font-variant-numeric: lining-nums;
    }

    /* ---------- Orientalisches Ornament ---------- */
    /* Dasselbe Achtstern-Raster wie auf der Schaufenster-Seite,
       als sehr blasser Hintergrund. */
    body::before {
      content: '';
      position: fixed;
      inset: 0;
      z-index: 0;
      pointer-events: none;
      opacity: 0.45;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='102' height='102' viewBox='0 0 102 102'%3E%3Cg fill='none' stroke='%23d4a95c' stroke-width='1' opacity='0.045' transform='rotate(45 51 51)'%3E%3Crect x='33' y='33' width='36' height='36'/%3E%3Crect x='33' y='33' width='36' height='36' transform='rotate(45 51 51)'/%3E%3Cpath d='M51 15v18M51 69v18M15 51h18M69 51h18'/%3E%3Ccircle cx='51' cy='51' r='4'/%3E%3C/g%3E%3C/svg%3E");
    }

    /* Inhalt liegt über dem Muster */
    body > * {
      position: relative;
      z-index: 1;
    }

    /* ---------- Bildflächen ohne Foto ---------- */
    /* Solange keine Fotos vorliegen, zeigt die Vorlage ein
       durchgestrichenes Bild-Symbol — das sieht nach Fehler aus.
       Stattdessen das Emblem des Ladens auf gemustertem Grund, wie
       auf der Schaufenster-Seite.
       Iconify-Symbole werden über CSS-Masken dargestellt, deshalb
       lässt sich die Maske einfach austauschen. */
    main span[class*='image-off'],
    aside span[class*='image-off'] {
      background-color: var(--gold-600) !important;
      opacity: 0.3;
      -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 104'%3E%3Cpath d='M11 100V48C11 27 23 11 40 4c17 7 29 23 29 44v52' fill='none' stroke='%23000' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'/%3E%3Cpath d='M40 22v66' fill='none' stroke='%23000' stroke-width='2.6' stroke-linecap='round'/%3E%3Cpath d='M40 27c9 0 14 7 15 17 1 11-2 22-6 30-2 4-5 6-9 6s-7-2-9-6c-4-8-7-19-6-30 1-10 6-17 15-17Z' fill='%23000'/%3E%3Cpath d='M40 99c-4 0-7-3-7-7 0-4 3-6 4-9 1 2 2 3 3 4 0-3 0-6 2-8 3 3 5 7 5 13 0 4-3 7-7 7Z' fill='%23000'/%3E%3C/svg%3E") !important;
      mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 104'%3E%3Cpath d='M11 100V48C11 27 23 11 40 4c17 7 29 23 29 44v52' fill='none' stroke='%23000' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'/%3E%3Cpath d='M40 22v66' fill='none' stroke='%23000' stroke-width='2.6' stroke-linecap='round'/%3E%3Cpath d='M40 27c9 0 14 7 15 17 1 11-2 22-6 30-2 4-5 6-9 6s-7-2-9-6c-4-8-7-19-6-30 1-10 6-17 15-17Z' fill='%23000'/%3E%3Cpath d='M40 99c-4 0-7-3-7-7 0-4 3-6 4-9 1 2 2 3 3 4 0-3 0-6 2-8 3 3 5 7 5 13 0 4-3 7-7 7Z' fill='%23000'/%3E%3C/svg%3E") !important;
      -webkit-mask-size: contain;
      mask-size: contain;
      -webkit-mask-repeat: no-repeat;
      mask-repeat: no-repeat;
      -webkit-mask-position: center;
      mask-position: center;
    }

    /* Die Fläche dahinter bekommt das Ornament */
    main div:has(> span[class*='image-off']),
    aside div:has(> span[class*='image-off']) {
      background-image:
        repeating-linear-gradient(
          135deg,
          rgba(212, 169, 92, 0.045) 0px,
          rgba(212, 169, 92, 0.045) 1px,
          transparent 1px,
          transparent 11px
        );
      border: 1px solid rgba(212, 169, 92, 0.09);
    }

    /* ---------- Feinschliff ---------- */
    /* Goldener Fokusrahmen für Tastaturbedienung */
    :focus-visible {
      outline: 2px solid var(--gold-500);
      outline-offset: 3px;
    }

    /* Warenkorb und Karten mit feiner goldener Kante beim Überfahren */
    a[href]:hover img,
    button:hover img {
      opacity: 0.92;
    }

    /* ---------- Bewegung ---------- */
    /* Produktkarten gleiten beim Erscheinen sanft herein. Die
       Verzögerung staffelt sie, damit es nicht ruckartig wirkt. */
    @keyframes og-auftauchen {
      from { opacity: 0; transform: translateY(14px); }
      to   { opacity: 1; transform: none; }
    }

    main article,
    main [class*='grid'] > * {
      animation: og-auftauchen 0.5s ease-out both;
    }

    main [class*='grid'] > *:nth-child(1) { animation-delay: 0.02s; }
    main [class*='grid'] > *:nth-child(2) { animation-delay: 0.06s; }
    main [class*='grid'] > *:nth-child(3) { animation-delay: 0.10s; }
    main [class*='grid'] > *:nth-child(4) { animation-delay: 0.14s; }
    main [class*='grid'] > *:nth-child(5) { animation-delay: 0.18s; }
    main [class*='grid'] > *:nth-child(6) { animation-delay: 0.22s; }

    /* Sanftes Anheben beim Überfahren einer Speise */
    main a[href*='/'] {
      transition: transform 0.25s ease-out;
    }
    main a[href*='/']:hover {
      transform: translateY(-3px);
    }

    /* Wer Bewegung abgeschaltet hat, bekommt keine. */
    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after {
        animation-duration: 0.01ms !important;
        animation-delay: 0ms !important;
        transition-duration: 0.01ms !important;
      }
      main a[href*='/']:hover {
        transform: none;
      }
    }
    `,
  ],

  // Kein Tracking. Die Vorlage brachte hier Yandex Metrika mit — ein
  // Dienst, der jeden Besucher an einen Dritten meldet. Ohne
  // Einwilligung ist das in Deutschland nicht zulässig, und ohne
  // Tracking braucht die Seite auch keinen Cookie-Banner.
  headScripts: [],
}

export function handleGetOptions(): GatewayGetOptionsResponse {
  return {
    ok: true,
    type: 'getOptions',
    result: options,
  }
}
