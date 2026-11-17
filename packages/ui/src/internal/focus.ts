export const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'summary',
  '[contenteditable]:not([contenteditable="false"])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

function isVisible(element: HTMLElement): boolean {
  return element.getClientRects().length > 0 && getComputedStyle(element).visibility !== 'hidden'
}

/** Tabbable descendants in DOM order (skips hidden and inert content). */
export function getFocusable(container: ParentNode): HTMLElement[] {
  return [...container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)].filter(
    (element) => !element.closest('[inert]') && isVisible(element),
  )
}

/** Whether `element` can still receive focus (connected, visible, enabled). */
export function canFocus(element: Element | null | undefined): element is HTMLElement {
  return (
    element instanceof HTMLElement &&
    element.isConnected &&
    !element.closest('[inert]') &&
    !(element as HTMLButtonElement).disabled &&
    isVisible(element)
  )
}

/**
 * Where focus should go when the element that opened an overlay no longer
 * exists: the closest focusable ancestor of `origin`, if any.
 */
export function closestFocusable(origin: Element | null | undefined): HTMLElement | undefined {
  let node = origin?.parentElement
  while (node) {
    if (node.matches(FOCUSABLE_SELECTOR) && canFocus(node)) return node
    node = node.parentElement
  }
  return undefined
}

export function activeElement(root: Document | ShadowRoot = document): Element | null {
  let active = root.activeElement
  while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement
  return active
}
