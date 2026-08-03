import type { ProductOptionGroup } from '@nextorders/food-schema'

// Zutaten zum Abwählen und Extras zum Dazubestellen.
//
// ⚠️ Die Aufpreise sind fachlich plausible Annahmen, aber **nicht vom
// Wirt bestätigt**. Der Flyer nennt keine Extra-Preise. Vor dem echten
// Betrieb müssen sie durchgesprochen werden — die Zahlen stehen
// deshalb gesammelt hier und nirgends sonst.

const AUFPREIS = {
  kaese: 1.0,
  feta: 1.0,
  halloumi: 1.5,
  fleisch: 2.0,
  falafel: 1.0,
  sosse: 0.5,
  jalapenos: 0.5,
  gemuese: 0.5,
  thunfisch: 1.5,
  ei: 1.0,
} as const

/** Kürzt die Schreibarbeit: aus einem Text wird eine Wahlmöglichkeit */
function wahl(id: string, text: string, preis = 0, vorausgewaehlt = false) {
  return {
    id,
    title: [{ locale: 'de' as const, value: text }],
    priceChange: preis,
    isDefault: vorausgewaehlt,
  }
}

function gruppe(
  id: string,
  titel: string,
  type: 'remove' | 'add',
  options: ReturnType<typeof wahl>[],
): ProductOptionGroup {
  return { id, title: [{ locale: 'de', value: titel }], type, options }
}

// ---------------------------------------------------------------
// Döner, Dürüm, Dönerbox, Tellergerichte, Lahmacun
// ---------------------------------------------------------------

/** Enthaltene Zutaten, alle vorausgewählt und kostenlos abwählbar */
const salatZutaten = gruppe('salat-weglassen', 'Salat anpassen', 'remove', [
  wahl('ohne-zwiebeln', 'Zwiebeln', 0, true),
  wahl('ohne-tomaten', 'Tomaten', 0, true),
  wahl('ohne-eisbergsalat', 'Eisbergsalat', 0, true),
  wahl('ohne-rotkohl', 'Rotkohl', 0, true),
  wahl('ohne-weisskohl', 'Weißkohl', 0, true),
  wahl('ohne-gurken', 'Gurken', 0, true),
])

const sossenZutaten = gruppe('sossen-weglassen', 'Soßen anpassen', 'remove', [
  wahl('ohne-knoblauchsosse', 'Knoblauchsoße', 0, true),
  wahl('ohne-joghurtsosse', 'Joghurtsoße', 0, true),
  wahl('ohne-chilisosse', 'Chilisoße', 0, true),
  wahl('ohne-kraeutersosse', 'Kräutersoße', 0, true),
])

const dönerExtras = gruppe('doener-extras', 'Extras', 'add', [
  wahl('extra-fleisch', 'Extra Fleisch', AUFPREIS.fleisch),
  wahl('extra-kaese', 'Käse', AUFPREIS.kaese),
  wahl('extra-feta', 'Feta', AUFPREIS.feta),
  wahl('extra-halloumi', 'Halloumi', AUFPREIS.halloumi),
  wahl('extra-falafel', 'Falafel', AUFPREIS.falafel),
  wahl('extra-jalapenos', 'Jalapeños', AUFPREIS.jalapenos),
  wahl('extra-sosse', 'Extra Soße', AUFPREIS.sosse),
])

export const optionenDoener: ProductOptionGroup[] = [
  salatZutaten,
  sossenZutaten,
  dönerExtras,
]

/** Ohne Salat: "nur Fleisch"-Gerichte und die Dönerbox mit Pommes */
export const optionenOhneSalat: ProductOptionGroup[] = [
  sossenZutaten,
  dönerExtras,
]

// ---------------------------------------------------------------
// Salate
// ---------------------------------------------------------------

export const optionenSalate: ProductOptionGroup[] = [
  salatZutaten,
  sossenZutaten,
  gruppe('salat-extras', 'Extras', 'add', [
    wahl('salat-extra-feta', 'Feta', AUFPREIS.feta),
    wahl('salat-extra-halloumi', 'Halloumi', AUFPREIS.halloumi),
    wahl('salat-extra-falafel', 'Falafel', AUFPREIS.falafel),
    wahl('salat-extra-fleisch', 'Fleisch', AUFPREIS.fleisch),
    wahl('salat-extra-thunfisch', 'Thunfisch', AUFPREIS.thunfisch),
  ]),
]

// ---------------------------------------------------------------
// Burger
// ---------------------------------------------------------------

export const optionenBurger: ProductOptionGroup[] = [
  gruppe('burger-weglassen', 'Zutaten anpassen', 'remove', [
    wahl('burger-ohne-zwiebeln', 'Zwiebeln', 0, true),
    wahl('burger-ohne-tomaten', 'Tomaten', 0, true),
    wahl('burger-ohne-salat', 'Salat', 0, true),
    wahl('burger-ohne-gurken', 'Gurken', 0, true),
    wahl('burger-ohne-ketchup', 'Ketchup', 0, true),
    wahl('burger-ohne-mayo', 'Mayonnaise', 0, true),
  ]),
  gruppe('burger-extras', 'Extras', 'add', [
    wahl('burger-extra-kaese', 'Käse', AUFPREIS.kaese),
    wahl('burger-extra-patty', 'Zweites Patty', AUFPREIS.fleisch),
    wahl('burger-extra-jalapenos', 'Jalapeños', AUFPREIS.jalapenos),
    wahl('burger-extra-ei', 'Spiegelei', AUFPREIS.ei),
    wahl('burger-extra-sosse', 'Extra Soße', AUFPREIS.sosse),
  ]),
]

// ---------------------------------------------------------------
// Pizza
// ---------------------------------------------------------------

export const optionenPizza: ProductOptionGroup[] = [
  gruppe('pizza-weglassen', 'Zutaten anpassen', 'remove', [
    wahl('pizza-ohne-zwiebeln', 'Zwiebeln', 0, true),
    wahl('pizza-ohne-knoblauch', 'Knoblauch', 0, true),
    wahl('pizza-ohne-oregano', 'Oregano', 0, true),
  ]),
  gruppe('pizza-extras', 'Extras', 'add', [
    wahl('pizza-extra-kaese', 'Extra Käse', AUFPREIS.kaese),
    wahl('pizza-extra-salami', 'Salami', AUFPREIS.kaese),
    wahl('pizza-extra-doenerfleisch', 'Dönerfleisch', AUFPREIS.fleisch),
    wahl('pizza-extra-thunfisch', 'Thunfisch', AUFPREIS.thunfisch),
    wahl('pizza-extra-champignons', 'Champignons', AUFPREIS.gemuese),
    wahl('pizza-extra-paprika', 'Paprika', AUFPREIS.gemuese),
    wahl('pizza-extra-mais', 'Mais', AUFPREIS.gemuese),
    wahl('pizza-extra-jalapenos', 'Jalapeños', AUFPREIS.jalapenos),
  ]),
]

// ---------------------------------------------------------------
// Wurst, Schnitzel und Beilagen
// ---------------------------------------------------------------

export const optionenImbiss: ProductOptionGroup[] = [
  gruppe('imbiss-extras', 'Extras', 'add', [
    wahl('imbiss-extra-ketchup', 'Ketchup', AUFPREIS.sosse),
    wahl('imbiss-extra-mayo', 'Mayonnaise', AUFPREIS.sosse),
    wahl('imbiss-extra-currysosse', 'Currysoße', AUFPREIS.sosse),
    wahl('imbiss-extra-kaese', 'Käse', AUFPREIS.kaese),
  ]),
]

// ---------------------------------------------------------------
// Zuweisung
// ---------------------------------------------------------------

/**
 * Hängt Optionen an eine ganze Kategorie.
 *
 * Gerichte, die von Haus aus ohne Salat kommen — die "nur
 * Fleisch"-Varianten und die Pommes —, bekommen die Salatgruppe
 * nicht: Man kann schließlich nichts abwählen, was nicht drin ist.
 */
// Einmal angelegt statt bei jedem Aufruf neu — so verlangt es die
// Code-Prüfung des Projekts.
const NUR_POMMES = /\d+\.\s*Pommes$/

export function mitOptionen<T extends { title: { value: string }[] }>(
  produkte: T[],
  gruppen: ProductOptionGroup[],
  gruppenOhneSalat?: ProductOptionGroup[],
): T[] {
  return produkte.map((produkt) => {
    const name = produkt.title[0]?.value ?? ''
    const kommtOhneSalat
      = name.includes('nur Fleisch')
        || name.endsWith('Pommes')
        || NUR_POMMES.test(name)

    return {
      ...produkt,
      optionGroups:
        kommtOhneSalat && gruppenOhneSalat ? gruppenOhneSalat : gruppen,
    }
  })
}
