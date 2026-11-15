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
  const collator = new Intl.Collator(locale, { sensitivity: 'base', usage: 'search' })
  const length = [...query].length
  // Repeating one character cycles through entries starting with it.
  const cycling = [...query].every((character) => collator.compare(character, [...query][0] ?? '') === 0)
  const needle = cycling ? ([...query][0] ?? '') : query
  const needleLength = cycling ? 1 : length
  const start = cycling || length === 1 ? current + 1 : Math.max(current, 0)

  for (let offset = 0; offset < labels.length; offset++) {
    const index = (start + offset) % labels.length
    const label = labels[index]
    if (label === undefined || isDisabled(index)) continue
    const head = [...label.trimStart()].slice(0, needleLength).join('')
    if (collator.compare(head, needle) === 0) return index
  }
  return -1
}

/** Case- and accent-insensitive "contains" for filtering option labels. */
export function createMatcher(locale?: string): (label: string, query: string) => boolean {
  const normalise = (value: string): string =>
    value
      .normalize('NFKD')
      .replace(/\p{Diacritic}/gu, '')
      .toLocaleLowerCase(locale)
  return (label, query) => {
    const needle = normalise(query.trim())
    return needle === '' || normalise(label).includes(needle)
  }
}
