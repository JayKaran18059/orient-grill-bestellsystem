import type { Product } from '@nextorders/food-schema'
import { gericht } from '../hilfen'

// Quelle: Flyer Orient Grill, Stand Juli 2026.
// Preise in Euro.

const beilage = 'Salat, Soße nach Wahl'
const nurSosse = 'Soße nach Wahl'

export const doener: Product[] = [
  gericht({ nr: 1, name: 'Döner Kebap im Brot', beschreibung: beilage, preis: 7.0 }),
  gericht({ nr: 2, name: 'Döner Kebap mit Feta', beschreibung: beilage, preis: 8.0 }),
  gericht({ nr: 3, name: 'Döner Kebap nur Fleisch', beschreibung: nurSosse, preis: 8.5 }),
  gericht({ nr: 4, name: 'Döner Kebap Extra Fleisch', beschreibung: beilage, preis: 8.5 }),
  gericht({ nr: 5, name: 'Chicken Döner', beschreibung: beilage, preis: 7.0 }),
  gericht({ nr: 6, name: 'Chicken Döner mit Feta', beschreibung: beilage, preis: 8.0 }),
  gericht({ nr: 7, name: 'Chicken Döner nur Fleisch', beschreibung: nurSosse, preis: 8.5 }),
  gericht({ nr: 8, name: 'Chicken Döner Extra Fleisch', beschreibung: beilage, preis: 8.5 }),
  gericht({ nr: 9, name: 'Halloumi-Döner', beschreibung: `${beilage} · vegetarisch`, preis: 6.5 }),
  gericht({ nr: 10, name: 'Schnitzel-Döner', beschreibung: beilage, preis: 6.5 }),
  gericht({ nr: 11, name: 'Vegetarischer Döner', beschreibung: `${beilage} · vegetarisch`, preis: 6.5 }),
  gericht({ nr: 12, name: 'Vegetarischer Döner mit Feta', beschreibung: `${beilage} · vegetarisch`, preis: 7.5 }),
  gericht({ nr: 13, name: 'Falafel-Döner', beschreibung: `${beilage} · vegetarisch`, preis: 6.5 }),
]
