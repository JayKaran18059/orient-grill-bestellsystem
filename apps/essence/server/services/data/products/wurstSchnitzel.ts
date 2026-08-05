import type { Product } from '@nextorders/food-schema'
import { gericht } from '../hilfen'

export const wurstSchnitzel: Product[] = [
  gericht({ nr: 50, name: 'Currywurst', preis: 4.5, bild: '/bilder/gerichte/gericht-050.jpg' }),
  gericht({ nr: 51, name: 'Currywurst mit Pommes', preis: 6.5, bild: '/bilder/gerichte/gericht-051.jpg' }),
  gericht({ nr: 52, name: 'Bratwurst', preis: 4.0, bild: '/bilder/gerichte/gericht-052.jpg' }),
  gericht({ nr: 53, name: 'Bratwurst mit Pommes', preis: 6.5, bild: '/bilder/gerichte/gericht-053.jpg' }),
  gericht({ nr: 54, name: 'Schnitzel mit Pommes oder Salat', preis: 8.0, bild: '/bilder/gerichte/gericht-054.jpg' }),
]
