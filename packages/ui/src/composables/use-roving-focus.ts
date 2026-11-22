import { moveIndex } from '../internal/collections.ts'
import { navigationIntent } from '../internal/events.ts'
import { activeElement } from '../internal/focus.ts'

export interface RovingFocusOptions {
  /** Element that owns the items (tablist, menu, toolbar, ...). */
  container: () => HTMLElement | null
  /** Selector of the items inside the container. */
  selector: string
  orientation: () => 'horizontal' | 'vertical' | 'both'
  /** Wrap from the last item to the first. Default `true`. */
  loop?: boolean
  /** Skip disabled items. Menus keep them focusable (`false`); tabs skip them. Default `true`. */
  skipDisabled?: boolean
}

export interface RovingFocus {
  items(): HTMLElement[]
  /**
   * Handles arrow keys/Home/End. Returns the newly focused item, or
   * `undefined` when the key was not a navigation key.
   */
  onKeydown(event: KeyboardEvent): HTMLElement | undefined
  focusIndex(index: number): HTMLElement | undefined
}

export const isItemDisabled = (item: HTMLElement): boolean =>
  (item as HTMLButtonElement).disabled === true || item.getAttribute('aria-disabled') === 'true'

/**
 * Arrow-key navigation over the items of a composite widget.
 *
 * Items are read from the DOM when a key is pressed, so there is no
 * registration to keep in sync and nothing to clean up. Horizontal lists
 * follow the writing direction of the container.
 */
export const useRovingFocus = (options: RovingFocusOptions): RovingFocus => {
  const skipDisabled = options.skipDisabled ?? true

  const items = (): HTMLElement[] => {
    const container = options.container()
    return container ? [...container.querySelectorAll<HTMLElement>(options.selector)] : []
  }

  const focusIndex = (index: number): HTMLElement | undefined => {
    const item = items()[index]
    item?.focus()
    return item
  }

  return {
    items,
    focusIndex,
    onKeydown: (event) => {
      const container = options.container()
      const intent = navigationIntent(event, options.orientation(), container)
      if (!intent) return undefined
      const list = items()
      const current = list.indexOf(activeElement() as HTMLElement)
      const index = moveIndex(
        list.length,
        current,
        intent,
        (candidate) => skipDisabled && isItemDisabled(list[candidate] as HTMLElement),
        options.loop ?? true,
      )
      if (index < 0) return undefined
      event.preventDefault()
      const item = list[index]
      item?.focus()
      return item
    },
  }
}
