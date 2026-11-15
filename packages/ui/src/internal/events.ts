/** Keys that move focus/selection, normalised for writing direction. */
export type NavigationIntent = 'next' | 'previous' | 'first' | 'last'

export function isRtl(element: Element | null | undefined): boolean {
  return element ? getComputedStyle(element).direction === 'rtl' : false
}

/**
 * Map an arrow/Home/End key to an intent for a list laid out along
 * `orientation`. Horizontal lists follow the writing direction.
 */
export function navigationIntent(
  event: KeyboardEvent,
  orientation: 'horizontal' | 'vertical' | 'both',
  element: Element | null,
): NavigationIntent | undefined {
  if (event.altKey || event.ctrlKey || event.metaKey) return undefined
  const rtl = isRtl(element)
  switch (event.key) {
    case 'ArrowDown':
      return orientation === 'horizontal' ? undefined : 'next'
    case 'ArrowUp':
      return orientation === 'horizontal' ? undefined : 'previous'
    case 'ArrowRight':
      if (orientation === 'vertical') return undefined
      return rtl ? 'previous' : 'next'
    case 'ArrowLeft':
      if (orientation === 'vertical') return undefined
      return rtl ? 'next' : 'previous'
    case 'Home':
      return 'first'
    case 'End':
      return 'last'
    default:
      return undefined
  }
}

/** A single printable character typed without a command modifier. */
export function isPrintableKey(event: KeyboardEvent): boolean {
  return event.key.length === 1 && event.key !== ' ' && !event.ctrlKey && !event.metaKey && !event.altKey
}
