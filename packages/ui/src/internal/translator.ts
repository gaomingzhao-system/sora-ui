import { toValue } from 'vue'
import type { MaybeRefOrGetter } from 'vue'
import en from '../locales/en.ts'
import type { UiMessageParams, UiTranslator } from '../types/config.ts'
import type { UiDirection } from '../types/common.ts'

/** Replace `{name}` placeholders. Unknown placeholders are left visible. */
export function formatMessage(template: string, params?: UiMessageParams): string {
  if (!params) return template
  return template.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = params[name]
    return value === undefined ? match : String(value)
  })
}

/** Built-in English used when no provider supplies a translator or a key is missing. */
export const englishTranslator: UiTranslator = Object.freeze({
  locale: 'en',
  translate(key: string, params?: UiMessageParams): string | undefined {
    const template = (en as Readonly<Record<string, string>>)[key]
    return template === undefined ? undefined : formatMessage(template, params)
  },
})

export interface CreateUiTranslatorOptions {
  /** Active locale; pass a ref or getter to make it switchable. */
  locale: MaybeRefOrGetter<string>
  /** Flat message dictionaries by locale. May be a reactive object to add locales lazily. */
  messages: Readonly<Record<string, Readonly<Record<string, string>> | undefined>>
  fallbackLocale?: string
}

/**
 * Dependency-free translator for apps that do not use an i18n library.
 * It reads `locale` and `messages` lazily, so reactive inputs update the UI.
 */
export function createUiTranslator(options: CreateUiTranslatorOptions): UiTranslator {
  const lookup = (locale: string, key: string): string | undefined => {
    const exact = options.messages[locale]?.[key]
    if (exact !== undefined) return exact
    const base = locale.split('-')[0]
    return base && base !== locale ? options.messages[base]?.[key] : undefined
  }
  return {
    get locale() {
      return toValue(options.locale)
    },
    translate(key, params) {
      const template =
        lookup(toValue(options.locale), key) ??
        (options.fallbackLocale ? lookup(options.fallbackLocale, key) : undefined)
      return template === undefined ? undefined : formatMessage(template, params)
    },
  }
}

const RTL_LANGUAGES = new Set([
  'ar',
  'arc',
  'ckb',
  'dv',
  'fa',
  'he',
  'ks',
  'ku',
  'nqo',
  'ps',
  'sd',
  'syr',
  'ug',
  'ur',
  'yi',
])

interface LocaleTextInfo {
  direction?: string
}
type LocaleWithTextInfo = Intl.Locale & {
  getTextInfo?: () => LocaleTextInfo
  textInfo?: LocaleTextInfo
}

/** Writing direction of a BCP 47 locale (uses `Intl.Locale` text info where available). */
export function directionOf(locale: string): UiDirection {
  try {
    const parsed = new Intl.Locale(locale) as LocaleWithTextInfo
    const direction = parsed.getTextInfo?.().direction ?? parsed.textInfo?.direction
    if (direction === 'rtl' || direction === 'ltr') return direction
    return RTL_LANGUAGES.has(parsed.language) ? 'rtl' : 'ltr'
  } catch {
    return 'ltr'
  }
}
