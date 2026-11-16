/**
 * Bindings for a caller-supplied trigger element.
 *
 * The library never clones slot content or guesses a DOM node from a
 * component instance. A custom trigger therefore binds three things
 * explicitly on its *native* element:
 *
 *   <button :ref="trigger.ref" v-bind="trigger.attrs" v-on="trigger.on">...</button>
 */
export interface SoraTriggerBindings {
  /** ARIA state, the id and the CSS anchor name. Use `v-bind`. */
  readonly attrs: {
    readonly id: string
    readonly 'aria-expanded': 'true' | 'false'
    readonly 'aria-controls': string
    readonly 'aria-haspopup'?: 'menu' | 'dialog' | undefined
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
