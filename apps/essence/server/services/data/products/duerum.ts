import type { Product } from '@nextorders/food-schema'
import { gericht } from '../hilfen'

const beilage = 'Salat, Soße nach Wahl'
const nurSosse = 'Soße nach Wahl'

export const duerum: Product[] = [
  gericht({ nr: 23, name: 'Dürüm mit Fleisch', beschreibung: beilage, preis: 7.5, bild: '/bilder/gerichte/gericht-023.jpg' }),
  gericht({ nr: 24, name: 'Dürüm mit Fleisch und Feta', beschreibung: beilage, preis: 8.5, bild: '/bilder/gerichte/gericht-024.jpg' }),
  gericht({ nr: 25, name: 'Dürüm nur Fleisch', beschreibung: nurSosse, preis: 8.5, bild: '/bilder/gerichte/gericht-025.jpg' }),
  gericht({ nr: 26, name: 'Vegetarischer Dürüm', beschreibung: `${beilage} · vegetarisch`, preis: 7.0, bild: '/bilder/gerichte/gericht-026.jpg' }),
  gericht({ nr: 27, name: 'Vegetarischer Dürüm mit Feta', beschreibung: `${beilage} · vegetarisch`, preis: 8.0, bild: '/bilder/gerichte/gericht-027.jpg' }),
  gericht({ nr: 28, name: 'Halloumi-Dürüm', beschreibung: `${beilage} · vegetarisch`, preis: 7.0, bild: '/bilder/gerichte/gericht-028.jpg' }),
  gericht({ nr: 29, name: 'Falafel-Dürüm', beschreibung: `${beilage} · vegetarisch`, preis: 7.0, bild: '/bilder/gerichte/gericht-029.jpg' }),
  gericht({ nr: 30, name: 'Schnitzel-Dürüm', beschreibung: beilage, preis: 7.0, bild: '/bilder/gerichte/gericht-030.jpg' }),
]
