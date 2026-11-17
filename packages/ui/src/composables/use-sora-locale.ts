import { computed } from 'vue'
import type { ComputedRef } from 'vue'
import { directionOf, englishTranslator } from '../internal/translator.ts'
import type { SoraMessageKey } from '../locales/en.ts'
import type { SoraDirection } from '../types/common.ts'
import type { SoraMessageParams } from '../types/config.ts'
import { useSoraContext } from './use-sora-config.ts'

export interface SoraLocale {
  /** Translate a library key (or any key the host translator knows). */
  t(key: SoraMessageKey | (string & {}), params?: SoraMessageParams): string
  /** Active BCP 47 locale. */
  readonly locale: ComputedRef<string>
  /** Writing direction implied by the provider or the locale. */
  readonly dir: ComputedRef<SoraDirection>
  /** `Intl.NumberFormat` for the active locale. */
  formatNumber(value: number, options?: Intl.NumberFormatOptions): string
}

/**
 * The translator interface components use. It reads the injected translator
 * and falls back to built-in English; it never imports an i18n library.
 */
export function useSoraLocale(): SoraLocale {
  const context = useSoraContext()
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
