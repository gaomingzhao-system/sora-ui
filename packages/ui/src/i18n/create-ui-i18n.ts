import { createI18n } from 'petite-vue-i18n'
import { computed } from 'vue'
import type { UiTranslator } from '../types/config.ts'
import type { CreateUiI18nOptions, UiI18n, UiI18nMessages, UiPetiteI18n } from './types.ts'

type Dictionary = Record<string, unknown>

/**
 * Adapt an existing petite-vue-i18n (or vue-i18n Composition API) instance
 * to the library's translator interface.
 *
 * Only the instance's global composer is used (`locale`, `messages`, `t`),
 * never `useI18n()`, so no second global instance is created and nothing
 * depends on a component instance. Unknown keys return `undefined`, which
 * lets the components fall back to their built-in English without logging a
 * missing-key warning.
 */
export function createPetiteTranslator(i18n: UiPetiteI18n): UiTranslator {
  const composer = i18n.global
  const has = (locale: string, key: string): boolean =>
    (composer.messages.value as Record<string, Dictionary | undefined>)[locale]?.[key] !== undefined

  return {
    get locale() {
      return composer.locale.value
    },
    translate(key, params) {
      const fallback = composer.fallbackLocale.value
      const known =
        has(composer.locale.value, key) ||
        (typeof fallback === 'string'
          ? has(fallback, key)
          : Array.isArray(fallback) && fallback.some((l) => has(l, key)))
      if (!known) return undefined
      return composer.t(key, { ...params })
    },
  }
}

/**
 * Create a petite-vue-i18n instance wired for the library: Composition mode,
 * flat keys, optional lazy loading, and a translator for UiProvider.
 *
 * ```ts
 * import en from '@your-scope/ui/i18n/locales/en'
 * const ui = createUiI18n({
 *   locale: 'en',
 *   messages: { en: { ...en, ...appMessages } },
 *   loadLocale: (locale) => import(`./locales/${locale}.ts`),
 * })
 * app.use(ui.i18n)
 * ```
 */
export function createUiI18n(options: CreateUiI18nOptions): UiI18n {
  const i18n = createI18n({
    legacy: false,
    locale: options.locale,
    fallbackLocale: options.fallbackLocale ?? options.locale,
    messages: { ...options.messages } as Record<string, Record<string, string>>,
    // Missing keys are expected (the components fall back to English) and are filtered before `t()`.
    missingWarn: false,
    fallbackWarn: false,
  }) as UiPetiteI18n
  const composer = i18n.global

  const loading = new Map<string, Promise<void>>()
  const hasLocale = (locale: string): boolean =>
    Object.keys((composer.messages.value as Record<string, Dictionary | undefined>)[locale] ?? {}).length > 0

  async function fetchLocale(
    locale: string,
    loader: NonNullable<CreateUiI18nOptions['loadLocale']>,
  ): Promise<void> {
    const loaded = await loader(locale)
    const messages = ('default' in loaded ? loaded.default : loaded) as UiI18nMessages
    composer.setLocaleMessage(locale, { ...messages } as Record<string, string>)
  }

  // Concurrent requests for one locale share a single load.
  async function load(locale: string): Promise<void> {
    if (hasLocale(locale) || !options.loadLocale) return
    let pending = loading.get(locale)
    if (!pending) {
      pending = fetchLocale(locale, options.loadLocale)
      loading.set(locale, pending)
      // Forget the request once it has settled (registered after `set`, so it
      // also covers a loader that throws synchronously): a failure can be retried.
      const forget = (): void => {
        loading.delete(locale)
      }
      pending.then(forget, forget)
    }
    await pending
  }

  return {
    i18n,
    translator: createPetiteTranslator(i18n),
    locale: computed({
      get: () => composer.locale.value as string,
      set: (value) => {
        composer.locale.value = value
      },
    }),
    async setLocale(locale) {
      await load(locale)
      composer.locale.value = locale
    },
    hasLocale,
  }
}
