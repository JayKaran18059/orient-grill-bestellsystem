import type { Product } from '@nextorders/food-schema'
import { gericht } from '../hilfen'

const nurSosse = 'Soße nach Wahl'

export const salate: Product[] = [
  gericht({ nr: 37, name: 'Gemischter Salat', beschreibung: `${nurSosse} · vegetarisch`, preis: 6.5, bild: '/bilder/gerichte/gericht-037.jpg' }),
  gericht({ nr: 38, name: 'Gemischter Salat mit Feta', beschreibung: `${nurSosse} · vegetarisch`, preis: 7.5, bild: '/bilder/gerichte/gericht-038.jpg' }),
  gericht({ nr: 39, name: 'Gemischter Salat mit Fleisch', beschreibung: nurSosse, preis: 8.5, bild: '/bilder/gerichte/gericht-039.jpg' }),
  gericht({ nr: 40, name: 'Gemischter Salat mit Falafel', beschreibung: `${nurSosse} · vegetarisch`, preis: 7.5, bild: '/bilder/gerichte/gericht-040.jpg' }),
  gericht({ nr: 41, name: 'Gemischter Salat mit Halloumi', beschreibung: `${nurSosse} · vegetarisch`, preis: 7.5, bild: '/bilder/gerichte/gericht-041.jpg' }),
]
