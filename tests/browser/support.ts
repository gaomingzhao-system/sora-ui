import { nextTick } from 'vue'
import { userEvent } from 'vitest/browser'

declare module 'vitest/browser' {
  // Custom commands registered in vitest.config.ts.
  interface BrowserCommands {
    /** Press the primary mouse button at the current pointer position. */
    mouseDown: () => Promise<void>
    /** Release the primary mouse button. */
    mouseUp: () => Promise<void>
    /** Move the real mouse to a point of the test frame, in `steps` moves. */
    mouseMove: (x: number, y: number, steps?: number) => Promise<void>
  }
}

/** The element with this `data-testid` (throws when it is missing). */
export function q<T extends HTMLElement = HTMLElement>(testId: string, scope: ParentNode = document): T {
  const element = scope.querySelector<T>(`[data-testid="${testId}"]`)
  if (!element) throw new Error(`missing [data-testid="${testId}"]`)
  return element
}

export function maybe<T extends HTMLElement = HTMLElement>(
  testId: string,
  scope: ParentNode = document,
): T | null {
  return scope.querySelector<T>(`[data-testid="${testId}"]`)
}

export function all<T extends HTMLElement = HTMLElement>(
  selector: string,
  scope: ParentNode = document,
): T[] {
  return [...scope.querySelectorAll<T>(selector)]
}

/** The first element matching a selector (throws when it is missing). */
export function $<T extends HTMLElement = HTMLElement>(selector: string, scope: ParentNode = document): T {
  const element = scope.querySelector<T>(selector)
  if (!element) throw new Error(`missing ${selector}`)
  return element
}

/** Press keys with real keyboard events (`{Enter}`, `{ArrowDown}`, `{Shift>}{Tab}{/Shift}`, ...). */
export async function press(keys: string): Promise<void> {
  await userEvent.keyboard(keys)
  await flush()
}

/** Vue's scheduler plus two frames: enough for top-layer, focus and layout changes. */
export async function flush(): Promise<void> {
  await nextTick()
  await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
  await nextTick()
}

export const wait = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

/** Poll until `predicate` holds (for asynchronous work such as debounced searches). */
export async function until(predicate: () => boolean, timeout = 2000): Promise<void> {
  const started = performance.now()
  while (!predicate()) {
    if (performance.now() - started > timeout) throw new Error('condition was not met in time')
    await wait(10)
    await nextTick()
  }
}

/** Ids referenced by an ARIA relationship attribute, resolved to elements. */
export function referenced(element: Element, attribute: string): HTMLElement[] {
  return (element.getAttribute(attribute) ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .map((id) => document.getElementById(id))
    .filter((target): target is HTMLElement => target !== null)
}

/** Text an element is described by (`aria-describedby`), in order. */
export function description(element: Element): string {
  return referenced(element, 'aria-describedby')
    .map((target) => target.textContent?.trim() ?? '')
    .join(' | ')
}
