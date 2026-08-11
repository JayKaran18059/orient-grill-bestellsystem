import type { Channel, GatewayGetChannelsResponse, GatewayGetDeliveryByCourierStatusRequest, GatewayGetDeliveryByCourierStatusResponse, GatewayGetSelfPickupStatusRequest, GatewayGetSelfPickupStatusResponse, GatewayGetTimeSlotsRequest, GatewayGetTimeSlotsResponse, PaymentMethod, Schedule } from '@nextorders/food-schema'
import { getOpeningStatus, getTimeSlotsFromNow } from './time'

// Der Betrieb: Orient Grill, Margaretenstraße 27a, 18057 Rostock.
//
// Die Vorlage hatte hier zwei russische Städte in elf Sprachen —
// rund 1.400 Zeilen. Weil in options.ts nur noch Deutsch angeboten
// wird, reichen deutsche Texte, und aus zwei Städten wird ein Standort.

const zahlungsarten: PaymentMethod[] = [
  {
    id: 'cash',
    type: 'cash',
    title: [
      {
        locale: 'de',
        value: 'Barzahlung bei Abholung',
      },
    ],
  },
  {
    id: 'card',
    type: 'card',
    title: [
      {
        locale: 'de',
        value: 'Kartenzahlung bei Abholung',
      },
    ],
  },
  // Im Voraus bezahlen. Welche Verfahren dahinter erscheinen — Karte,
  // Apple Pay, Google Pay, PayPal — stellt der Wirt bei Stripe ein,
  // hier ist dafür nichts zu ändern.
  //
  // Ohne hinterlegten Stripe-Schlüssel blendet die Kasse diesen Eintrag
  // aus und es bleibt beim Bezahlen vor Ort.
  {
    id: 'online',
    type: 'online',
    title: [
      {
        locale: 'de',
        value: 'Jetzt online bezahlen',
      },
    ],
    hint: [
      {
        locale: 'de',
        value: 'Karte, Apple Pay, Google Pay oder PayPal',
      },
    ],
  },
]

// Öffnungszeiten laut Flyer:
// Mo–Do 10–22 Uhr, Fr–Sa 10–23 Uhr, So 10–22 Uhr
const oeffnungszeiten: Schedule = [
  { day: 'mon', isClosed: false, hours: [{ start: '10:00', end: '22:00' }] },
  { day: 'tue', isClosed: false, hours: [{ start: '10:00', end: '22:00' }] },
  { day: 'wed', isClosed: false, hours: [{ start: '10:00', end: '22:00' }] },
  { day: 'thu', isClosed: false, hours: [{ start: '10:00', end: '22:00' }] },
  { day: 'fri', isClosed: false, hours: [{ start: '10:00', end: '23:00' }] },
  { day: 'sat', isClosed: false, hours: [{ start: '10:00', end: '23:00' }] },
  { day: 'sun', isClosed: false, hours: [{ start: '10:00', end: '22:00' }] },
]

const abholBedingungen = [
  {
    locale: 'de' as const,
    value: `Deine Bestellung steht in der Regel innerhalb von 20 bis 30 Minuten für dich bereit.

Für die Abholung gibt es keinen Mindestbestellwert — du kannst bestellen, worauf du Lust hast. Die Abholung ist kostenlos, es fallen keine zusätzlichen Gebühren an.

Bezahlt wird bei der Abholung, bar oder mit Karte.

Bei hohem Andrang kann es etwas länger dauern. Wir sagen dir am Telefon Bescheid, wenn es knapp wird.`,
  },
]

const impressumHinweis = [
  {
    locale: 'de' as const,
    value: `© Orient Grill, Margaretenstraße 27a, 18057 Rostock.

Alle Preise verstehen sich inklusive Mehrwertsteuer. Abbildungen können vom Original abweichen. Die Angaben auf dieser Seite stellen kein bindendes Angebot dar.`,
  },
]

const channels: Channel[] = [
  {
    id: 'rostock',
    selectorTitle: [
      {
        locale: 'de',
        value: 'Rostock',
      },
    ],
    title: [
      {
        locale: 'de',
        value: 'Orient Grill Rostock',
      },
    ],
    description: [
      {
        locale: 'de',
        value: 'Döner frisch vom Spieß, Pizza aus dem Ofen und türkische Spezialitäten in der Margaretenstraße.',
      },
    ],
    url: 'http://localhost:3502',
    timeZone: '+01:00',
    isActive: true,

    // Ob geliefert wird, ist mit dem Wirt noch nicht geklärt. Der Flyer
    // nennt nur Abholung. Sobald das feststeht, hier auf true setzen
    // und Liefergebiet, Mindestbestellwert und Gebühr ergänzen.
    deliveryByCourier: {
      isAvailable: false,
      paymentMethods: [],
    },

    selfPickup: {
      isAvailable: true,
      conditions: abholBedingungen,
      schedule: oeffnungszeiten,
      paymentMethods: zahlungsarten,
      warehouses: [
        {
          id: 'margaretenstrasse',
          title: [
            {
              locale: 'de',
              value: 'Orient Grill, Margaretenstraße 27a',
            },
          ],
          address: {
            street: [
              {
                locale: 'de',
                value: 'Margaretenstraße 27a, 18057 Rostock',
              },
            ],
          },
        },
      ],
    },

    copyright: impressumHinweis,

    links: {
      aside: [],
      footer: [],
      social: [],
    },
  },
]

export function handleGetChannels(): GatewayGetChannelsResponse {
  return {
    ok: true,
    type: 'getChannels',
    result: channels,
  }
}

export function handleGetDeliveryByCourierStatus({ channelId }: GatewayGetDeliveryByCourierStatusRequest['body']): GatewayGetDeliveryByCourierStatusResponse {
  const channel = channels.find((channel) => channel.id === channelId)
  if (!channel || !channel.deliveryByCourier?.schedule) {
    throw createError({
      statusCode: 404,
      message: 'Channel not found',
    })
  }

  return {
    ok: true,
    type: 'getDeliveryByCourierStatus',
    result: getOpeningStatus(channel.deliveryByCourier.schedule, channel.timeZone),
  }
}

export function handleGetSelfPickupStatus({ channelId }: GatewayGetSelfPickupStatusRequest['body']): GatewayGetSelfPickupStatusResponse {
  const channel = channels.find((channel) => channel.id === channelId)
  if (!channel || !channel.selfPickup?.schedule) {
    throw createError({
      statusCode: 404,
      message: 'Channel not found',
    })
  }

  return {
    ok: true,
    type: 'getSelfPickupStatus',
    result: getOpeningStatus(channel.selfPickup.schedule, channel.timeZone),
  }
}

export function handleGetTimeSlots(data: GatewayGetTimeSlotsRequest['body']): GatewayGetTimeSlotsResponse {
  const channel = channels.find((channel) => channel.id === data.channelId)
  if (!channel) {
    throw createError({
      statusCode: 404,
      message: 'Channel not found',
    })
  }

  const schedule = data.deliveryMethod === 'deliveryByCourier' ? channel.deliveryByCourier.schedule : channel.selfPickup.schedule
  if (!schedule) {
    throw createError({
      statusCode: 404,
      message: 'Schedule not found',
    })
  }

  return {
    ok: true,
    type: 'getTimeSlots',
    result: getTimeSlotsFromNow(schedule, channel.timeZone),
  }
}
