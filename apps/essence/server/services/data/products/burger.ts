import type { Product } from '@nextorders/food-schema'
import { gericht } from '../hilfen'

export const burger: Product[] = [
  gericht({ nr: 42, name: 'Hamburger', preis: 6.5 }),
  gericht({ nr: 43, name: 'Hamburger mit Pommes', preis: 8.5 }),
  gericht({ nr: 44, name: 'Cheeseburger', preis: 7.5 }),
  gericht({ nr: 45, name: 'Cheeseburger mit Pommes', preis: 8.5 }),
  gericht({ nr: 46, name: 'Chili-Cheeseburger', preis: 7.5 }),
  gericht({ nr: 47, name: 'Chili-Cheeseburger mit Pommes', preis: 8.5 }),
  gericht({ nr: 48, name: 'Doppel-Cheeseburger', preis: 9.5 }),
  gericht({ nr: 49, name: 'Chicken Nuggets mit Pommes', preis: 7.5 }),
]
