import type { NavigationIntent } from './events.ts'

/**
 * Index reached from `current` by `intent`, skipping entries for which
 * `isDisabled` is true. Returns `-1` when nothing is available.
 */
export function moveIndex(
  count: number,
  current: number,
  intent: NavigationIntent,
  isDisabled: (index: number) => boolean = () => false,
  loop = true,
): number {
  if (count <= 0) return -1
  const step = intent === 'next' || intent === 'first' ? 1 : -1
  let index: number
  if (intent === 'first') index = 0
  else if (intent === 'last') index = count - 1
  else if (current < 0) index = step === 1 ? 0 : count - 1
  else index = current + step

  for (let visited = 0; visited < count; visited++) {
    if (index < 0 || index >= count) {
      if (!loop || intent === 'first' || intent === 'last') return -1
      index = (index + count) % count
    }
    if (!isDisabled(index)) return index
    index += step
  }
  return -1
}

/** One collator per locale: constructing one is far more expensive than comparing with it. */
const collators = new Map<string, Intl.Collator>()

function searchCollator(locale: string | undefined): Intl.Collator {
  const key = locale ?? ''
  let collator = collators.get(key)
  if (!collator) {
    collator = new Intl.Collator(locale, { sensitivity: 'base', usage: 'search' })
    collators.set(key, collator)
  }
  return collator
}

/**
 * Typeahead match: the next label (after `current`, wrapping) that starts
 * with `query`, compared case- and accent-insensitively for `locale`.
 */
export function findByPrefix(
  labels: readonly string[],
  query: string,
  current: number,
  locale?: string,
  isDisabled: (index: number) => boolean = () => false,
): number {
  if (!query) return -1
  const collator = searchCollator(locale)
  // Code points, so a typed emoji or astral character counts as one.
  const characters = [...query]
  const first = characters[0] ?? ''
  // Repeating one character cycles through entries starting with it.
  const cycling = characters.every((character) => collator.compare(character, first) === 0)
  const needle = cycling ? first : query
  const needleLength = cycling ? 1 : characters.length
  const start = cycling || characters.length === 1 ? current + 1 : Math.max(current, 0)

  for (let offset = 0; offset < labels.length; offset++) {
    const index = (start + offset) % labels.length
    const label = labels[index]
    if (label === undefined || isDisabled(index)) continue
    const head = [...label.trimStart()].slice(0, needleLength).join('')
    if (collator.compare(head, needle) === 0) return index
  }
  return -1
}

/** Labels kept normalised per matcher before the cache starts over. */
const MATCHER_CACHE_SIZE = 2048

/**
 * Case- and accent-insensitive "contains" for filtering option labels.
 *
 * Filtering calls the matcher once per option with the same query, keystroke
 * after keystroke: the query is normalised once per new query, and every
 * label once per matcher (labels repeat from one keystroke to the next).
 */
export function createMatcher(locale?: string): (label: string, query: string) => boolean {
  const normalise = (value: string): string =>
    value
      .normalize('NFKD')
      .replace(/\p{Diacritic}/gu, '')
      .toLocaleLowerCase(locale)
  const labels = new Map<string, string>()
  let lastQuery: string | undefined
  let needle = ''
  return (label, query) => {
    if (query !== lastQuery) {
      lastQuery = query
      needle = normalise(query.trim())
    }
    if (needle === '') return true
    let normalised = labels.get(label)
    if (normalised === undefined) {
      if (labels.size >= MATCHER_CACHE_SIZE) labels.clear()
      normalised = normalise(label)
      labels.set(label, normalised)
    }
    return normalised.includes(needle)
  }
}
