import { inject } from 'vue'
import type { InjectionKey } from 'vue'
import type { SoraComponentDefaults } from '@your-scope/theme'
import { generatedDefaults } from '../config.generated.ts'
import type { SoraContext } from '../types/config.ts'

export const soraContextKey: InjectionKey<SoraContext> = Symbol('sora.context')

/** Context used when no SoraProvider is present: generated defaults, English, inherited direction. */
const rootContext = Object.freeze({
  defaults: Object.freeze({ value: generatedDefaults }),
  translator: Object.freeze({ value: undefined }),
  locale: Object.freeze({ value: undefined }),
  dir: Object.freeze({ value: undefined }),
}) as unknown as SoraContext

/** The nearest SoraProvider's context, or the library defaults. */
export function useSoraContext(): SoraContext {
  return inject(soraContextKey, rootContext)
}

/**
 * Reactive prop defaults for one component family. Resolution order is
 * explicit prop > nearest SoraProvider `defaults` > sora.config.ts.
 */
export function useSoraDefaults<K extends keyof SoraComponentDefaults>(
  key: K,
): () => SoraComponentDefaults[K] {
  const context = useSoraContext()
  return () => context.defaults.value[key]
}
