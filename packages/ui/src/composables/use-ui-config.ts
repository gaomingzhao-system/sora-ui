import { inject } from 'vue'
import type { InjectionKey } from 'vue'
import type { UiComponentDefaults } from '@your-scope/theme'
import { generatedDefaults } from '../config.generated.ts'
import type { UiContext } from '../types/config.ts'

export const uiContextKey: InjectionKey<UiContext> = Symbol('vui.context')

/** Context used when no UiProvider is present: generated defaults, English, inherited direction. */
const rootContext = Object.freeze({
  defaults: Object.freeze({ value: generatedDefaults }),
  translator: Object.freeze({ value: undefined }),
  locale: Object.freeze({ value: undefined }),
  dir: Object.freeze({ value: undefined }),
}) as unknown as UiContext

/** The nearest UiProvider's context, or the library defaults. */
export function useUiContext(): UiContext {
  return inject(uiContextKey, rootContext)
}

/**
 * Reactive prop defaults for one component family. Resolution order is
 * explicit prop > nearest UiProvider `defaults` > ui.config.ts.
 */
export function useUiDefaults<K extends keyof UiComponentDefaults>(key: K): () => UiComponentDefaults[K] {
  const context = useUiContext()
  return () => context.defaults.value[key]
}
