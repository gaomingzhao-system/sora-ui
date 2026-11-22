/**
 * Bindings for a caller-supplied trigger element.
 *
 * The library never clones slot content or guesses a DOM node from a
 * component instance. A custom trigger therefore binds three things
 * explicitly on its *native* element:
 *
 *   <button :ref="trigger.ref" v-bind="trigger.attrs" v-on="trigger.on">...</button>
 *
 * On a `<button>`, `popovertarget` makes it a native invoker: the browser
 * toggles the overlay on click, returns focus to it and uses it as the
 * anchor. `on.click` toggles in script only for elements that cannot be
 * invokers.
 */
export interface SoraTriggerBindings {
  /** ARIA state, the id and the CSS anchor name. Use `v-bind`. */
  readonly attrs: {
    readonly id: string
    readonly 'aria-expanded': 'true' | 'false'
    readonly 'aria-controls': string
    readonly 'aria-haspopup'?: 'menu' | 'dialog' | undefined
    /** The overlay's id: makes a `<button>` its native invoker. */
    readonly popovertarget: string
    readonly style: Readonly<Record<string, string>>
  }
  /** Event listeners. Use `v-on`. */
  readonly on: {
    readonly click: (event: MouseEvent) => void
    readonly keydown: (event: KeyboardEvent) => void
  }
  /** Function ref; must receive the native element (not a component instance). */
  readonly ref: (element: unknown) => void
  /** Whether the overlay is open. */
  readonly open: boolean
}

/**
 * Whether the browser itself toggles the overlay for this click: a `<button>`
 * (or `<input type="button">`) with `popovertarget` is a native invoker.
 */
export const isNativeInvoker = (target: EventTarget | null): boolean =>
  (target instanceof HTMLButtonElement || target instanceof HTMLInputElement) &&
  target.hasAttribute('popovertarget')
