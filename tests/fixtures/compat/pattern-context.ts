import type { ComputedRef, InjectionKey } from 'vue'

export const patternKey: InjectionKey<ComputedRef<string>> = Symbol('pattern')
