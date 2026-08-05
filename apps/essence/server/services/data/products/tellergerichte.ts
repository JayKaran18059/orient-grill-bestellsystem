import type { Product } from '@nextorders/food-schema'
import { gericht } from '../hilfen'

const beilage = 'Salat, Soße nach Wahl'

export const tellergerichte: Product[] = [
  gericht({ nr: 14, name: 'Dönerteller mit Fleisch', beschreibung: beilage, preis: 10.5, bild: '/bilder/gerichte/gericht-014.jpg' }),
  gericht({ nr: 15, name: 'Dönerteller mit Fleisch und Brot', beschreibung: beilage, preis: 11.0, bild: '/bilder/gerichte/gericht-015.jpg' }),
  gericht({ nr: 16, name: 'Dönerteller mit Fleisch und Pommes', beschreibung: beilage, preis: 12.0, bild: '/bilder/gerichte/gericht-016.jpg' }),
  gericht({ nr: 17, name: 'Falafelteller', beschreibung: `${beilage} · vegetarisch`, preis: 8.5, bild: '/bilder/gerichte/gericht-017.jpg' }),
  gericht({ nr: 18, name: 'Döner-Fleischschale groß', beschreibung: `Kalb oder Hähnchen, ${beilage}`, preis: 10.0, bild: '/bilder/gerichte/gericht-018.jpg' }),
  gericht({ nr: 19, name: 'Döner-Fleischschale klein', beschreibung: `Kalb oder Hähnchen, ${beilage}`, preis: 9.0, bild: '/bilder/gerichte/gericht-019.jpg' }),
]
