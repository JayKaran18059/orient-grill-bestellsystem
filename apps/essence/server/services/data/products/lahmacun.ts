import type { Product } from '@nextorders/food-schema'
import { gericht } from '../hilfen'

const beilage = 'Salat, Soße nach Wahl'
const nurSosse = 'Soße nach Wahl'

export const lahmacun: Product[] = [
  gericht({ nr: 31, name: 'Türkische Pizza mit Fleisch', beschreibung: beilage, preis: 8.0 }),
  gericht({ nr: 32, name: 'Türkische Pizza mit Fleisch und Feta', beschreibung: beilage, preis: 9.0 }),
  gericht({ nr: 33, name: 'Türkische Pizza nur Fleisch', beschreibung: nurSosse, preis: 9.0 }),
  gericht({ nr: 34, name: 'Vegetarische Türkische Pizza', beschreibung: `${beilage} · vegetarisch`, preis: 7.5 }),
  gericht({ nr: 35, name: 'Türkische Pizza mit Halloumi', beschreibung: `${beilage} · vegetarisch`, preis: 7.5 }),
  gericht({ nr: 36, name: 'Türkische Pizza mit Falafel', beschreibung: `${beilage} · vegetarisch`, preis: 7.5 }),
]
