import { computed, shallowRef, useAttrs, watch } from 'vue'
import type { ComputedRef, ShallowRef } from 'vue'
import { composeHandlers, mergeIds } from '../internal/attributes.ts'
import type { SoraControlAttrs } from '../types/common.ts'

type Attrs = Record<string, unknown>

export interface SoraControl<E extends HTMLElement> {
  /** `class` and `style` from the caller: they customise the root element. */
  readonly rootAttrs: ComputedRef<Attrs>
  /** Everything else, merged with `controlAttrs`: bound to the native control. */
  readonly nativeAttrs: ComputedRef<Attrs>
  /** The native control once mounted. */
  readonly element: ShallowRef<E | null>
  /** Function ref for the native control; also feeds `controlAttrs.ref`. */
  setElement(value: unknown): void
  /** Generated ids merged with any `aria-describedby` the caller supplied. */
  describedBy(...generated: readonly (string | undefined)[]): string | undefined
}

const isListener = (key: string): boolean => /^on[A-Z]/.test(key)

/**
 * Attribute routing shared by every wrapper control.
 *
 * - `class`/`style` go to the root, all other attributes and listeners go to
 *   the native control, never to both.
 * - `controlAttrs` (for example Formisch's `field.props`) is merged in:
 *   listeners are composed with the caller's, `aria-describedby` ids are
 *   merged, and `ref` receives the same native element as the component's
 *   own ref (and `null` on unmount).
 */
export function useControl<E extends HTMLElement = HTMLElement>(
  controlAttrs: () => SoraControlAttrs | undefined,
): SoraControl<E> {
  const attrs = useAttrs()
  const element = shallowRef(null) as ShallowRef<E | null>
  /** `controlAttrs` as a plain record (it may carry arbitrary attributes). */
  const extras = (): Attrs => (controlAttrs() ?? {}) as Attrs

  const rootAttrs = computed<Attrs>(() => ({ class: attrs['class'], style: attrs['style'] }))

  const nativeAttrs = computed<Attrs>(() => {
    const result: Attrs = {}
    for (const [key, value] of Object.entries(attrs)) {
      if (key === 'class' || key === 'style' || key === 'aria-describedby') continue
      result[key] = value
    }
    for (const [key, value] of Object.entries(extras())) {
      if (key === 'ref' || key === 'aria-describedby') continue
      const existing = result[key]
      result[key] =
        isListener(key) && typeof existing === 'function' && typeof value === 'function'
          ? composeHandlers(existing as (event: unknown) => void, value as (event: unknown) => void)
          : value
    }
    return result
  })

  let registered: Element | null = null

  function setElement(value: unknown): void {
    const next = value instanceof HTMLElement ? (value as E) : null
    element.value = next
    if (next === registered) return
    registered = next
    controlAttrs()?.ref?.(next)
  }

  // A different binding object (e.g. another form field) must learn about the element too.
  watch(
    () => controlAttrs()?.ref,
    (next, previous) => {
      if (next === previous || !registered) return
      previous?.(null)
      next?.(registered)
    },
  )

  return {
    rootAttrs,
    nativeAttrs,
    element,
    setElement,
    describedBy(...generated) {
      return mergeIds(...generated, attrs['aria-describedby'], extras()['aria-describedby'])
    },
  }
}
