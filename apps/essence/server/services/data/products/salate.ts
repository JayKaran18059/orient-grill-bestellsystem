import type { Product } from '@nextorders/food-schema'
import { gericht } from '../hilfen'

const nurSosse = 'Soße nach Wahl'

export const salate: Product[] = [
  gericht({ nr: 37, name: 'Gemischter Salat', beschreibung: `${nurSosse} · vegetarisch`, preis: 6.5 }),
  gericht({ nr: 38, name: 'Gemischter Salat mit Feta', beschreibung: `${nurSosse} · vegetarisch`, preis: 7.5 }),
  gericht({ nr: 39, name: 'Gemischter Salat mit Fleisch', beschreibung: nurSosse, preis: 8.5 }),
  gericht({ nr: 40, name: 'Gemischter Salat mit Falafel', beschreibung: `${nurSosse} · vegetarisch`, preis: 7.5 }),
  gericht({ nr: 41, name: 'Gemischter Salat mit Halloumi', beschreibung: `${nurSosse} · vegetarisch`, preis: 7.5 }),
]
