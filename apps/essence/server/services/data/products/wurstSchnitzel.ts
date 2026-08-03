import type { Product } from '@nextorders/food-schema'
import { gericht } from '../hilfen'

export const wurstSchnitzel: Product[] = [
  gericht({ nr: 50, name: 'Currywurst', preis: 4.5 }),
  gericht({ nr: 51, name: 'Currywurst mit Pommes', preis: 6.5 }),
  gericht({ nr: 52, name: 'Bratwurst', preis: 4.0 }),
  gericht({ nr: 53, name: 'Bratwurst mit Pommes', preis: 6.5 }),
  gericht({ nr: 54, name: 'Schnitzel mit Pommes oder Salat', preis: 8.0 }),
]
