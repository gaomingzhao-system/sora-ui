import type { ComputedRef } from 'vue'
import type { UiComponentDefaults } from '@your-scope/theme'
import type { UiDirection } from './common.ts'

/** Values interpolated into `{name}` placeholders. */
export type UiMessageParams = Readonly<Record<string, string | number>>

/**
 * The only contract between the components and an i18n system.
 *
 * `locale` must be reactive (a getter over reactive state) so components
 * re-render when it changes. The optional petite-vue-i18n adapter
 * (`@your-scope/ui/i18n`) implements this; hosts can wrap any translator.
 */
export interface UiTranslator {
  /** BCP 47 language tag, e.g. `en`, `ja`, `ar`. */
  readonly locale: string
  /** Returns the translated message, or `undefined` when the key is unknown. */
  translate(key: string, params?: UiMessageParams): string | undefined
}

/** What UiProvider shares with descendants (typed provide/inject). */
export interface UiContext {
  readonly defaults: ComputedRef<UiComponentDefaults>
  readonly translator: ComputedRef<UiTranslator | undefined>
  /** Explicit locale for `Intl` formatting; falls back to the translator's. */
  readonly locale: ComputedRef<string | undefined>
  readonly dir: ComputedRef<UiDirection | undefined>
}
