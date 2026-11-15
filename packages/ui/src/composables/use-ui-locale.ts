import { computed } from 'vue'
import type { ComputedRef } from 'vue'
import { directionOf, englishTranslator } from '../internal/translator.ts'
import type { UiMessageKey } from '../locales/en.ts'
import type { UiDirection } from '../types/common.ts'
import type { UiMessageParams } from '../types/config.ts'
import { useUiContext } from './use-ui-config.ts'

export interface UiLocale {
  /** Translate a library key (or any key the host translator knows). */
  t(key: UiMessageKey | (string & {}), params?: UiMessageParams): string
  /** Active BCP 47 locale. */
  readonly locale: ComputedRef<string>
  /** Writing direction implied by the provider or the locale. */
  readonly dir: ComputedRef<UiDirection>
  /** `Intl.NumberFormat` for the active locale. */
  formatNumber(value: number, options?: Intl.NumberFormatOptions): string
}

/**
 * The translator interface components use. It reads the injected translator
 * and falls back to built-in English; it never imports an i18n library.
 */
export function useUiLocale(): UiLocale {
  const context = useUiContext()
  const locale = computed(
    () => context.locale.value ?? context.translator.value?.locale ?? englishTranslator.locale,
  )
  const dir = computed(() => context.dir.value ?? directionOf(locale.value))

  return {
    t(key, params) {
      return (
        context.translator.value?.translate(key, params) ?? englishTranslator.translate(key, params) ?? key
      )
    },
    locale,
    dir,
    formatNumber(value, options) {
      return new Intl.NumberFormat(locale.value, options).format(value)
    },
  }
}
