import type { I18n } from 'petite-vue-i18n'
import type { WritableComputedRef } from 'vue'
import type { UiTranslator } from '../types/config.ts'

/** Flat dictionary accepted by petite-vue-i18n: strings, or precompiled messages. */
export type UiI18nMessages = Readonly<Record<string, unknown>>

/** A petite-vue-i18n instance in Composition mode. */
// The adapter only touches `global.locale`, `global.messages` and `global.t`,
// which have the same shape for every message schema.
// oxlint-disable-next-line typescript/no-explicit-any
export type UiPetiteI18n = I18n<any, any, any, string, false>

export interface CreateUiI18nOptions {
  /** Initial locale. */
  locale: string
  fallbackLocale?: string | undefined
  /** Messages available immediately, by locale (library messages merged with the application's). */
  messages?: Readonly<Record<string, UiI18nMessages>> | undefined
  /**
   * Loads the messages of a locale on demand (typically a dynamic `import()`).
   * `setLocale()` calls it the first time a locale is requested.
   */
  loadLocale?: ((locale: string) => Promise<UiI18nMessages | { default: UiI18nMessages }>) | undefined
}

export interface UiI18n {
  /** The petite-vue-i18n instance. Install it with `app.use(i18n)` if the app also uses `useI18n()`. */
  readonly i18n: UiPetiteI18n
  /** Pass to `<UiProvider :translator>`. */
  readonly translator: UiTranslator
  /** The active locale (reactive, writable). */
  readonly locale: WritableComputedRef<string>
  /** Load the locale's messages if necessary, then switch to it. */
  setLocale(locale: string): Promise<void>
  /** Whether messages for the locale are already present. */
  hasLocale(locale: string): boolean
}
