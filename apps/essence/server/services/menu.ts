import type { GatewayGetMenuResponse, Menu } from '@nextorders/food-schema'
import { mitOptionen, optionenBurger, optionenDoener, optionenImbiss, optionenOhneSalat, optionenPizza, optionenSalate } from './data/optionen'
import { burger } from './data/products/burger'
import { doener } from './data/products/doener'
import { doenerbox } from './data/products/doenerbox'
import { duerum } from './data/products/duerum'
import { getraenke } from './data/products/getraenke'
import { lahmacun } from './data/products/lahmacun'
import { pizza } from './data/products/pizza'
import { salate } from './data/products/salate'
import { tellergerichte } from './data/products/tellergerichte'
import { wurstSchnitzel } from './data/products/wurstSchnitzel'

// Die Speisekarte, Reihenfolge wie auf dem gedruckten Flyer.
// Die Gerichte selbst stehen in ./data/products/ — eine Datei je
// Kategorie. Preise ändern sich dort, nicht hier.
//
// Die Symbole stammen aus der Sammlung "fluent-emoji-flat", die mit
// der Vorlage mitgeliefert wird.

const categories: Menu['categories'] = [
  {
    id: 'doener',
    slug: 'doener',
    title: [{ locale: 'de', value: 'Döner' }],
    icon: 'i-fluent-emoji-flat:stuffed-flatbread',
    products: mitOptionen(doener, optionenDoener, optionenOhneSalat),
  },
  {
    id: 'tellergerichte',
    slug: 'tellergerichte',
    title: [{ locale: 'de', value: 'Tellergerichte' }],
    icon: 'i-fluent-emoji-flat:shallow-pan-of-food',
    products: mitOptionen(tellergerichte, optionenDoener, optionenOhneSalat),
  },
  {
    id: 'doenerbox',
    slug: 'doenerbox',
    title: [{ locale: 'de', value: 'Dönerbox' }],
    icon: 'i-fluent-emoji-flat:french-fries',
    products: mitOptionen(doenerbox, optionenDoener, optionenOhneSalat),
  },
  {
    id: 'duerum',
    slug: 'duerum',
    title: [{ locale: 'de', value: 'Dürüm' }],
    icon: 'i-fluent-emoji-flat:burrito',
    products: mitOptionen(duerum, optionenDoener, optionenOhneSalat),
  },
  {
    id: 'lahmacun',
    slug: 'lahmacun',
    title: [{ locale: 'de', value: 'Lahmacun' }],
    icon: 'i-fluent-emoji-flat:flatbread',
    products: mitOptionen(lahmacun, optionenDoener, optionenOhneSalat),
  },
  {
    id: 'salate',
    slug: 'salate',
    title: [{ locale: 'de', value: 'Salate' }],
    icon: 'i-fluent-emoji-flat:green-salad',
    products: mitOptionen(salate, optionenSalate),
  },
  {
    id: 'burger',
    slug: 'burger',
    title: [{ locale: 'de', value: 'Burger' }],
    icon: 'i-fluent-emoji-flat:hamburger',
    products: mitOptionen(burger, optionenBurger),
  },
  {
    id: 'wurst-schnitzel',
    slug: 'wurst-schnitzel',
    title: [{ locale: 'de', value: 'Wurst & Schnitzel' }],
    icon: 'i-fluent-emoji-flat:hot-dog',
    products: mitOptionen(wurstSchnitzel, optionenImbiss),
  },
  {
    id: 'pizza',
    slug: 'pizza',
    title: [{ locale: 'de', value: 'Pizza' }],
    icon: 'i-fluent-emoji-flat:pizza',
    products: mitOptionen(pizza, optionenPizza),
  },
  {
    id: 'getraenke',
    slug: 'getraenke',
    title: [{ locale: 'de', value: 'Getränke' }],
    icon: 'i-fluent-emoji-flat:cup-with-straw',
    products: getraenke,
  },
]

const menu: Menu = {
  id: 'speisekarte',
  title: [{ locale: 'de', value: 'Speisekarte' }],
  slug: 'speisekarte',
  isActive: true,
  categories,
}

export function handleGetMenu(): GatewayGetMenuResponse {
  return {
    ok: true,
    type: 'getMenu',
    result: menu,
  }
}
