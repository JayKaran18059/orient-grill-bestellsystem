import type { Product } from '@nextorders/food-schema'
import { gericht } from '../hilfen'

const beilage = 'Salat, Soße nach Wahl'

export const tellergerichte: Product[] = [
  gericht({ nr: 14, name: 'Dönerteller mit Fleisch', beschreibung: beilage, preis: 10.5 }),
  gericht({ nr: 15, name: 'Dönerteller mit Fleisch und Brot', beschreibung: beilage, preis: 11.0 }),
  gericht({ nr: 16, name: 'Dönerteller mit Fleisch und Pommes', beschreibung: beilage, preis: 12.0 }),
  gericht({ nr: 17, name: 'Falafelteller', beschreibung: `${beilage} · vegetarisch`, preis: 8.5 }),
  gericht({ nr: 18, name: 'Döner-Fleischschale groß', beschreibung: `Kalb oder Hähnchen, ${beilage}`, preis: 10.0 }),
  gericht({ nr: 19, name: 'Döner-Fleischschale klein', beschreibung: `Kalb oder Hähnchen, ${beilage}`, preis: 9.0 }),
]
