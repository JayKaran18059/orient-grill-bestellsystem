import type { Product } from '@nextorders/food-schema'
import { gerichtMitGroessen } from '../hilfen'

// Die einzige Kategorie mit mehreren Größen. Der Gast wählt sie beim
// Bestellen aus; angezeigt wird in der Übersicht der günstigste Preis.
const groessen = ['26 cm', '28 cm', '36 cm']

export const pizza: Product[] = [
  gerichtMitGroessen({
    nr: 55,
    name: 'Pizza Margherita',
    beschreibung: 'mit Tomatensauce und Käse · vegetarisch',
    groessen,
    preise: [8.0, 10.5, 15.5], bild: '/bilder/gerichte/gericht-055.jpg' }),
  gerichtMitGroessen({
    nr: 56,
    name: 'Pizza Salami',
    beschreibung: 'mit Salami und Käse',
    groessen,
    preise: [9.0, 12.0, 17.5], bild: '/bilder/gerichte/gericht-056.jpg' }),
  gerichtMitGroessen({
    nr: 57,
    name: 'Pizza Vegetaria',
    beschreibung: 'mit Broccoli, Mais, Paprika und Champignons · vegetarisch',
    groessen,
    preise: [9.5, 13.0, 19.0], bild: '/bilder/gerichte/gericht-057.jpg' }),
  gerichtMitGroessen({
    nr: 58,
    name: 'Pizza Spinat-Feta-Gorgonzola',
    beschreibung: 'mit Spinat, Fetakäse und Gorgonzola · vegetarisch',
    groessen,
    preise: [9.5, 13.5, 18.5], bild: '/bilder/gerichte/gericht-058.jpg' }),
  gerichtMitGroessen({
    nr: 59,
    name: 'Pizza Mexicana',
    beschreibung: 'mit Zwiebeln, Paprika, Peperoni und Hackfleisch',
    groessen,
    preise: [10.5, 14.0, 19.5], bild: '/bilder/gerichte/gericht-059.jpg' }),
  gerichtMitGroessen({
    nr: 60,
    name: 'Pizza Alaska',
    beschreibung: 'mit Thunfisch und Zwiebeln',
    groessen,
    preise: [10.5, 14.0, 19.5], bild: '/bilder/gerichte/gericht-060.jpg' }),
  gerichtMitGroessen({
    nr: 61,
    name: 'Pizza Orient Grill',
    beschreibung: 'mit Tomatensauce, Käse, Dönerfleisch und Champignons',
    groessen,
    preise: [12.0, 13.5, 19.5],
    bild: '/bilder/gerichte/gericht-061.jpg',
  }),
  gerichtMitGroessen({
    nr: 62,
    name: 'Pizza BBQ-Cheese',
    beschreibung: 'mit Salami, Zwiebeln, Spinat, Mais, Jalapeños, Knoblauch und BBQ-Creme-Sauce',
    groessen,
    preise: [10.5, 14.0, 19.5], bild: '/bilder/gerichte/gericht-062.jpg' }),
  gerichtMitGroessen({
    nr: 63,
    name: 'Pizza Curry-Chicken',
    beschreibung: 'mit Hähnchenfleisch, Zwiebeln, Paprika und Curry-Sauce',
    groessen,
    preise: [11.0, 14.5, 20.0], bild: '/bilder/gerichte/gericht-063.jpg' }),
  gerichtMitGroessen({
    nr: 64,
    name: 'Pizza Veggie',
    beschreibung: 'mit Mais, Broccoli, Spinat, Champignons, Paprika, Zwiebeln, Feta und Knoblauch · vegetarisch',
    groessen,
    preise: [10.0, 14.0, 19.0], bild: '/bilder/gerichte/gericht-064.jpg' }),
  gerichtMitGroessen({
    nr: 65,
    name: 'Pizza Tonno',
    beschreibung: 'mit Tomatensauce, Thunfisch und Zwiebeln',
    groessen,
    preise: [9.0, 13.5, 18.5], bild: '/bilder/gerichte/gericht-065.jpg' }),
]
