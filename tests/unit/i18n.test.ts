import { reactive, ref } from 'vue'
import { describe, expect, it } from 'vitest'
import { compileMessages } from '../../scripts/compiled-messages-plugin.ts'
import { pseudoLocalize } from '../../packages/ui/src/internal/pseudo.ts'
import {
  createSoraTranslator,
  directionOf,
  englishTranslator,
  formatMessage,
} from '../../packages/ui/src/internal/translator.ts'
import ar from '../../packages/ui/src/locales/ar.ts'
import en from '../../packages/ui/src/locales/en.ts'
import ja from '../../packages/ui/src/locales/ja.ts'
import pseudo from '../../packages/ui/src/locales/pseudo.ts'

const placeholders = (message: string): string[] =>
  [...message.matchAll(/\{(\w+)\}/g)].map((m) => m[1] ?? '').toSorted()

describe('message formatting', () => {
  it('interpolates named placeholders and leaves unknown ones visible', () => {
    expect(formatMessage('Page {page} of {total}', { page: 2, total: 9 })).toBe('Page 2 of 9')
    expect(formatMessage('Hello {name}', {})).toBe('Hello {name}')
    expect(formatMessage('No placeholders')).toBe('No placeholders')
  })

  it('provides built-in English and reports unknown keys as undefined', () => {
    expect(englishTranslator.locale).toBe('en')
    expect(englishTranslator.translate('dialog.close')).toBe('Close')
    expect(englishTranslator.translate('pagination.status', { page: 1, total: 3 })).toBe('Page 1 of 3')
    expect(englishTranslator.translate('nope')).toBeUndefined()
  })
})

describe('createSoraTranslator', () => {
  it('follows a reactive locale and falls back from region to language to fallback locale', () => {
    const locale = ref('ja-JP')
    const translator = createSoraTranslator({ locale, messages: { en, ja }, fallbackLocale: 'en' })
    expect(translator.locale).toBe('ja-JP')
    expect(translator.translate('dialog.close')).toBe('閉じる')
    locale.value = 'fr'
    expect(translator.locale).toBe('fr')
    expect(translator.translate('dialog.close')).toBe('Close')
    expect(translator.translate('missing.key')).toBeUndefined()
  })

  it('sees dictionaries added later to a reactive messages object', () => {
    const messages = reactive<Record<string, Record<string, string>>>({ en: { ...en } })
    const translator = createSoraTranslator({ locale: 'ar', messages })
    expect(translator.translate('dialog.close')).toBeUndefined()
    messages['ar'] = { ...ar }
    expect(translator.translate('dialog.close')).toBe('إغلاق')
  })
})

describe('direction', () => {
  it('derives the writing direction from the locale', () => {
    expect(directionOf('ar')).toBe('rtl')
    expect(directionOf('he-IL')).toBe('rtl')
    expect(directionOf('fa')).toBe('rtl')
    expect(directionOf('en')).toBe('ltr')
    expect(directionOf('ja-JP')).toBe('ltr')
    expect(directionOf('not a locale')).toBe('ltr')
  })
})

describe('locale dictionaries', () => {
  const keys = Object.keys(en).toSorted()

  it.each([
    ['ja', ja],
    ['ar', ar],
    ['pseudo', pseudo],
  ] as const)('%s has exactly the English keys and placeholders', (_name, dictionary) => {
    expect(Object.keys(dictionary).toSorted()).toEqual(keys)
    for (const key of keys) {
      const message = (dictionary as Record<string, string>)[key] ?? ''
      expect(message.trim(), key).not.toBe('')
      expect(placeholders(message), key).toEqual(placeholders((en as Record<string, string>)[key] ?? ''))
    }
  })

  it('uses flat keys with plain strings only (no linked messages, pipes or markup)', () => {
    for (const dictionary of [en, ja, ar]) {
      for (const [key, message] of Object.entries(dictionary)) {
        expect(typeof message, key).toBe('string')
        expect(message, key).not.toMatch(/[@|<>]/)
      }
    }
  })

  it('pseudo-localises text while keeping placeholders intact', () => {
    expect(pseudoLocalize('Page {page} of {total}')).toMatch(/^\[Þàĝé \{page\} öƒ \{total\}( ~)+\]$/)
    expect(pseudo['dialog.close']).not.toBe(en['dialog.close'])
    // Longer than the source, to expose truncation.
    expect([...pseudo['pagination.status']].length).toBeGreaterThan([...en['pagination.status']].length)
  })
})

describe('message precompilation', () => {
  it('turns every message into a message AST object', () => {
    const compiled = compileMessages({ plain: 'Save', named: 'Page {page} of {total}' })
    expect(Object.keys(compiled)).toEqual(['plain', 'named'])
    for (const ast of Object.values(compiled)) {
      expect(ast).toBeTypeOf('object')
      expect(ast).not.toBeNull()
    }
    expect(JSON.stringify(compiled['named'])).toContain('page')
  })

  it('compiles every shipped dictionary', () => {
    for (const dictionary of [en, ja, ar, pseudo]) {
      expect(Object.keys(compileMessages(dictionary))).toHaveLength(Object.keys(en).length)
    }
  })

  it('fails loudly on a message that does not compile or is not a string', () => {
    expect(() => compileMessages({ broken: 'Unclosed {name' }, 'test')).toThrow(/broken/)
    expect(() => compileMessages({ wrong: 1 as unknown as string }, 'test')).toThrow(/not a string/)
  })
})
