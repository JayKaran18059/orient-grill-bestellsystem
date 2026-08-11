import type { OrderItem, WeekDay, WeightUnit } from '@nextorders/food-schema'

/**
 * Ist diese Warenkorbzeile genau so belegt wie gewünscht?
 *
 * Der Mengenzähler darf nur an einer Zeile hängen, die exakt der
 * gerade eingestellten Zusammenstellung entspricht. Sonst würde das
 * Plus einen Döner mit fremden Soßen hochzählen. Ohne Angabe ist die
 * schlichte Variante ohne jede Anpassung gemeint.
 */
export function hatGenauDieseOptionen(zeile: OrderItem, optionIds: string[] = []): boolean {
  const vorhanden = (zeile.selectedOptions ?? []).map((option) => option.optionId).sort()
  const gewuenscht = optionIds.toSorted()

  return vorhanden.length === gewuenscht.length && vorhanden.every((id, index) => id === gewuenscht[index])
}

export function getWeightLocalizedUnit<WeightUnitLiteral = string & object>(unit?: WeightUnit | WeightUnitLiteral): string {
  const { dict } = useDictionary()

  switch (unit as WeightUnit) {
    case 'g':
      return dict('common.abbreviation.g')
    case 'kg':
      return dict('common.abbreviation.kg')
    case 'ml':
      return dict('common.abbreviation.ml')
    case 'l':
      return dict('common.abbreviation.l')
    case 'lb':
      return dict('common.abbreviation.lb')
    case 'oz':
      return dict('common.abbreviation.oz')
    default:
      return ''
  }
}

export function getLocalizedWeekDay(day: WeekDay): string {
  const { dict } = useDictionary()

  switch (day) {
    case 'mon':
      return dict('common.day.monday')
    case 'tue':
      return dict('common.day.tuesday')
    case 'wed':
      return dict('common.day.wednesday')
    case 'thu':
      return dict('common.day.thursday')
    case 'fri':
      return dict('common.day.friday')
    case 'sat':
      return dict('common.day.saturday')
    case 'sun':
      return dict('common.day.sunday')
    default:
      return ''
  }
}
