import type { Product } from '@nextorders/food-schema'
import { gericht } from '../hilfen'

const nurSosse = 'Soße nach Wahl'

export const doenerbox: Product[] = [
  gericht({ nr: 20, name: 'Dönerbox mit Pommes', beschreibung: nurSosse, preis: 7.5, bild: '/bilder/gerichte/gericht-020.jpg' }),
  gericht({ nr: 21, name: 'Dönerbox mit Salat', beschreibung: nurSosse, preis: 7.5, bild: '/bilder/gerichte/gericht-021.jpg' }),
  gericht({ nr: 22, name: 'Pommes', beschreibung: 'vegetarisch', preis: 4.5, bild: '/bilder/gerichte/gericht-022.jpg' }),
]
