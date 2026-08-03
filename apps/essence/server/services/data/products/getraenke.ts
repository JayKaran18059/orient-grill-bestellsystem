import type { Product } from '@nextorders/food-schema'
import { gericht } from '../hilfen'

export const getraenke: Product[] = [
  gericht({ nr: 70, name: 'Cola Zero, Fanta, Sprite, Uludag oder Apfelschorle', preis: 2.5 }),
  gericht({ nr: 71, name: 'Red Bull', preis: 2.5 }),
  gericht({ nr: 72, name: 'Eistee', preis: 2.5 }),
  gericht({ nr: 73, name: 'Wasser', preis: 2.0 }),
  gericht({ nr: 74, name: 'Ayran', preis: 2.0 }),
]
