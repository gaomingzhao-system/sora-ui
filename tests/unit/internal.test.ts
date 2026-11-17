import { describe, expect, it, vi } from 'vitest'
import {
  ariaBool,
  composeHandlers,
  mergeIds,
  omitKeys,
  splitAttrs,
} from '../../packages/ui/src/internal/attributes.ts'
import { createMatcher, findByPrefix, moveIndex } from '../../packages/ui/src/internal/collections.ts'
import { anchorName } from '../../packages/ui/src/internal/ids.ts'

describe('attributes', () => {
  it('merges id references without duplicates or empties', () => {
    expect(mergeIds('a', undefined, 'b c', null, false, 'a', '')).toBe('a b c')
    expect(mergeIds(undefined, '')).toBeUndefined()
  })

  it('splits class/style from control attributes', () => {
    const handler = (): void => {}
    expect(splitAttrs({ class: 'x', style: 'y', name: 'n', onBlur: handler })).toEqual({
      root: { class: 'x', style: 'y' },
      control: { name: 'n', onBlur: handler },
    })
  })

  it('composes handlers in order and tolerates gaps', () => {
    const calls: string[] = []
    const first = vi.fn(() => calls.push('first'))
    const second = vi.fn(() => calls.push('second'))
    composeHandlers<number>(first, undefined, second, null)(7)
    expect(calls).toEqual(['first', 'second'])
    expect(first).toHaveBeenCalledWith(7)
  })

  it('omits keys and formats ARIA booleans', () => {
    expect(omitKeys({ a: 1, b: 2, c: 3 }, ['b'])).toEqual({ a: 1, c: 3 })
    expect(ariaBool(true)).toBe('true')
    expect(ariaBool(false)).toBeUndefined()
    expect(ariaBool(false, false)).toBe('false')
  })

  it('derives a valid CSS dashed ident for anchors', () => {
    expect(anchorName('sora-v-0-anchor')).toBe('--sora-v-0-anchor')
    expect(anchorName('a:b c')).toBe('--a-b-c')
  })
})

describe('moveIndex', () => {
  const disabled = (blocked: number[]) => (index: number) => blocked.includes(index)

  it('moves forwards and backwards with wrapping', () => {
    expect(moveIndex(3, 0, 'next')).toBe(1)
    expect(moveIndex(3, 2, 'next')).toBe(0)
    expect(moveIndex(3, 0, 'previous')).toBe(2)
    expect(moveIndex(3, -1, 'next')).toBe(0)
    expect(moveIndex(3, -1, 'previous')).toBe(2)
  })

  it('stops at the ends when looping is off', () => {
    expect(moveIndex(3, 2, 'next', undefined, false)).toBe(-1)
    expect(moveIndex(3, 0, 'previous', undefined, false)).toBe(-1)
  })

  it('skips disabled entries, including at the ends', () => {
    expect(moveIndex(4, 0, 'next', disabled([1, 2]))).toBe(3)
    expect(moveIndex(4, 3, 'first', disabled([0]))).toBe(1)
    expect(moveIndex(4, 0, 'last', disabled([3]))).toBe(2)
    expect(moveIndex(4, 3, 'next', disabled([0]))).toBe(1)
  })

  it('returns -1 when nothing is available', () => {
    expect(moveIndex(0, -1, 'next')).toBe(-1)
    expect(moveIndex(2, 0, 'next', () => true)).toBe(-1)
    expect(moveIndex(2, 0, 'first', () => true)).toBe(-1)
  })
})

describe('typeahead and filtering', () => {
  const labels = ['Apple', 'Apricot', 'Banana', 'Éclair', 'blueberry']

  it('finds the next label starting with the typed prefix', () => {
    expect(findByPrefix(labels, 'b', -1)).toBe(2)
    expect(findByPrefix(labels, 'b', 2)).toBe(4)
    expect(findByPrefix(labels, 'b', 4)).toBe(2)
    expect(findByPrefix(labels, 'ap', -1)).toBe(0)
    expect(findByPrefix(labels, 'apr', 0)).toBe(1)
    expect(findByPrefix(labels, 'z', 0)).toBe(-1)
    expect(findByPrefix(labels, '', 0)).toBe(-1)
  })

  it('cycles through matches when one character is repeated', () => {
    expect(findByPrefix(labels, 'aa', 0)).toBe(1)
    expect(findByPrefix(labels, 'aaa', 1)).toBe(0)
  })

  it('ignores case and accents, and skips disabled entries', () => {
    expect(findByPrefix(labels, 'e', -1)).toBe(3)
    expect(findByPrefix(labels, 'B', -1, 'en', (index) => index === 2)).toBe(4)
  })

  it('filters with a locale-aware, accent-insensitive "contains"', () => {
    const matches = createMatcher('en')
    expect(matches('Crème brûlée', 'brulee')).toBe(true)
    expect(matches('Crème brûlée', 'CREME')).toBe(true)
    expect(matches('Apple', 'pp')).toBe(true)
    expect(matches('Apple', 'x')).toBe(false)
    expect(matches('Apple', '   ')).toBe(true)
    // Turkish dotless i is handled by the locale-aware lower-casing.
    expect(createMatcher('tr')('IŞIK', 'ışık')).toBe(true)
  })

  it('keeps one matcher correct across changing queries and many labels (cached normalisation)', () => {
    const matches = createMatcher('en')
    const labels = ['Apple', 'Apricot', 'Cherry', 'Crème brûlée']
    const filter = (query: string): string[] => labels.filter((label) => matches(label, query))
    expect(filter('ap')).toEqual(['Apple', 'Apricot'])
    expect(filter('ch')).toEqual(['Cherry'])
    expect(filter('creme')).toEqual(['Crème brûlée'])
    expect(filter('ap')).toEqual(['Apple', 'Apricot'])
    expect(filter('  ')).toEqual(labels)
    // Past the cache size it starts over and keeps answering correctly.
    for (let index = 0; index < 3000; index++) matches(`Label ${index}`, 'label')
    expect(filter('apr')).toEqual(['Apricot'])
  })
})
