import type { Product, ProductOptionGroup } from '@nextorders/food-schema'

// Hilfsfunktionen, damit die Speisekarte lesbar bleibt.
//
// Ohne sie bräuchte jedes der 74 Gerichte rund zwanzig Zeilen
// verschachtelte Objekte. Mit ihnen ist ein Gericht eine Zeile —
// wichtig, weil hier jemand Preise pflegen muss, der kein
// Entwickler ist.

// Einmal angelegt statt bei jedem Aufruf neu — so verlangt es auch
// die Code-Prüfung des Projekts.
const UMLAUT_AE = /ä/g
const UMLAUT_OE = /ö/g
const UMLAUT_UE = /ü/g
const ESZETT = /ß/g
const NICHT_ERLAUBT = /[^a-z0-9]+/g
const BINDESTRICH_AM_RAND = /^-|-$/g

/** Aus "Döner Kebap mit Feta" wird "doener-kebap-mit-feta" */
function zuSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(UMLAUT_AE, 'ae')
    .replace(UMLAUT_OE, 'oe')
    .replace(UMLAUT_UE, 'ue')
    .replace(ESZETT, 'ss')
    .replace(NICHT_ERLAUBT, '-')
    .replace(BINDESTRICH_AM_RAND, '')
}

interface GerichtEingabe {
  /** Nummer auf der Speisekarte, erscheint vor dem Namen */
  nr: number
  name: string
  /** Beilagen oder Zutaten, z.B. "Salat, Soße nach Wahl" */
  beschreibung?: string
  /** Preis in Euro, z.B. 7.5 für 7,50 € */
  preis: number
  /** Zutaten zum Abwählen und Extras, siehe ../optionen.ts */
  optionen?: ProductOptionGroup[]
}

/**
 * Ein Gericht mit einem einzigen Preis.
 *
 * Bilder bleiben leer — es gibt noch keine Fotos vom Laden. Die
 * Oberfläche zeigt dann einen Platzhalter. Sobald Fotos da sind,
 * hier `images` befüllen.
 */
export function gericht({ nr, name, beschreibung, preis, optionen }: GerichtEingabe): Product {
  const slug = zuSlug(name)

  return {
    id: slug,
    slug,
    title: [{ locale: 'de', value: `${nr}. ${name}` }],
    description: beschreibung
      ? [{ locale: 'de', value: beschreibung }]
      : undefined,
    isAvailableForPurchase: true,
    isShownInCatalog: true,
    optionGroups: optionen,
    variants: [
      {
        id: `${slug}-standard`,
        title: [{ locale: 'de', value: 'Standard' }],
        images: [],
        weightUnit: 'g',
        weightValue: 0,
        price: preis,
        sku: null,
        nutritionFacts: null,
      },
    ],
  }
}

interface GroessenGerichtEingabe {
  nr: number
  name: string
  beschreibung?: string
  /** Bezeichnungen der Größen, z.B. ['26 cm', '28 cm', '36 cm'] */
  groessen: string[]
  /** Preise in derselben Reihenfolge wie `groessen` */
  preise: number[]
  /** Zutaten zum Abwählen und Extras, siehe ../optionen.ts */
  optionen?: ProductOptionGroup[]
}

/**
 * Ein Gericht in mehreren Größen — bei uns die Pizzen.
 * Der Gast wählt die Größe später im Bestellvorgang aus.
 */
export function gerichtMitGroessen({
  nr,
  name,
  beschreibung,
  groessen,
  preise,
  optionen,
}: GroessenGerichtEingabe): Product {
  if (groessen.length !== preise.length) {
    throw new Error(
      `${name}: ${groessen.length} Größen, aber ${preise.length} Preise — das passt nicht zusammen.`,
    )
  }

  const slug = zuSlug(name)

  return {
    id: slug,
    slug,
    title: [{ locale: 'de', value: `${nr}. ${name}` }],
    description: beschreibung
      ? [{ locale: 'de', value: beschreibung }]
      : undefined,
    isAvailableForPurchase: true,
    isShownInCatalog: true,
    optionGroups: optionen,
    variants: groessen.map((groesse, index) => ({
      id: `${slug}-${zuSlug(groesse)}`,
      title: [{ locale: 'de', value: groesse }],
      images: [],
      weightUnit: 'g' as const,
      weightValue: 0,
      price: preise[index] as number,
      sku: null,
      nutritionFacts: null,
    })),
  }
}
