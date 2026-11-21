import { onScopeDispose } from 'vue'
import { findByPrefix } from '../internal/collections.ts'
import { isPrintableKey } from '../internal/events.ts'

export interface TypeaheadOptions {
  labels: () => readonly string[]
  /** Index the search starts after (the focused/active item). */
  current: () => number
  isDisabled?: (index: number) => boolean
  locale?: () => string | undefined
  onMatch: (index: number) => void
  /** Idle time after which the typed prefix resets. Default 600ms. */
  timeout?: number
}

export interface Typeahead {
  /** Returns `true` when the key was consumed as typeahead input. */
  onKeydown(event: KeyboardEvent): boolean
  reset(): void
}

/** Type-to-select for menus and listboxes (multi-character, locale-aware). */
export function useTypeahead(options: TypeaheadOptions): Typeahead {
  let buffer = ''
  let timer: ReturnType<typeof setTimeout> | undefined

  function reset(): void {
    buffer = ''
    if (timer !== undefined) clearTimeout(timer)
    timer = undefined
  }

  onScopeDispose(reset)

  return {
    reset,
    onKeydown(event) {
      // A space only counts while a prefix is being typed ("new y").
      const continuing = event.key === ' ' && buffer !== ''
      if (!isPrintableKey(event) && !continuing) return false
      buffer += event.key
      if (timer !== undefined) clearTimeout(timer)
      timer = setTimeout(reset, options.timeout ?? 600)
      const index = findByPrefix(
        options.labels(),
        buffer,
        options.current(),
        options.locale?.(),
        options.isDisabled,
      )
      if (index >= 0) options.onMatch(index)
      event.preventDefault()
      return true
    },
  }
}
