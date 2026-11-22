import { onBeforeUnmount, onMounted, watch, type Ref } from 'vue'
import { activeElement, canFocus, closestFocusable } from '../internal/focus.ts'

/** Why an overlay closed. */
/** `drag` is a sheet that was swiped away. */
export type SoraCloseReason = 'escape' | 'backdrop' | 'drag' | 'action' | 'programmatic'

export interface UseModalDialogOptions {
  element: () => HTMLDialogElement | null
  open: Ref<boolean>
  closeOnEscape: () => boolean
  closeOnBackdrop: () => boolean
  /** Element to focus when the dialog opens (defaults to `[data-autofocus]`, then native behaviour). */
  initialFocus?: () => HTMLElement | null | undefined
  /** Where focus goes on close when the opener is gone, or to override it. */
  returnFocus?: () => HTMLElement | null | undefined
  onClose?: (reason: SoraCloseReason) => void
}

export interface ModalDialogBindings {
  /** Close through the component (`reason` is reported to `onClose`). */
  close(reason?: SoraCloseReason): void
  onCancel(event: Event): void
  onClose(): void
  onPointerdown(event: PointerEvent): void
  onClick(event: MouseEvent): void
}

/**
 * Keeps a `v-model:open` boolean and a native `<dialog>` in sync.
 *
 * The native element is the source of truth for modality, the top layer,
 * inertness of the page and Escape handling; this composable only mirrors
 * state, applies the dismissal policy and repairs focus restoration when the
 * opener has been removed.
 */
export const useModalDialog = (options: UseModalDialogOptions): ModalDialogBindings => {
  let opener: Element | null = null
  let reason: SoraCloseReason = 'programmatic'
  let pressedOnBackdrop = false

  const show = (): void => {
    const element = options.element()
    if (!element || element.open || !element.isConnected) return
    opener = activeElement()
    reason = 'programmatic'
    element.showModal()
    const target = options.initialFocus?.() ?? element.querySelector<HTMLElement>('[data-autofocus]')
    target?.focus()
  }

  const close = (nextReason: SoraCloseReason = 'programmatic'): void => {
    const element = options.element()
    reason = nextReason
    if (element?.open) element.close()
    else options.open.value = false
  }

  const restoreFocus = (): void => {
    const explicit = options.returnFocus?.()
    if (canFocus(explicit)) {
      explicit.focus()
      return
    }
    if (canFocus(opener)) {
      // The browser already restores focus to the opener; repair it only if needed.
      if (activeElement() !== opener) opener.focus()
      return
    }
    closestFocusable(options.element())?.focus()
  }

  watch(
    options.open,
    (open) => {
      if (open) show()
      else if (options.element()?.open) close('programmatic')
    },
    { flush: 'post' },
  )

  onMounted(() => {
    if (options.open.value) show()
  })

  onBeforeUnmount(() => {
    // Leaving a modal dialog open would keep the page inert.
    const element = options.element()
    if (element?.open) element.close()
  })

  return {
    close,
    onCancel: (event) => {
      // `cancel` is the close request (Escape, Android back, ...).
      if (options.closeOnEscape()) reason = 'escape'
      else event.preventDefault()
    },
    onClose: () => {
      // Fires for every way a dialog closes, including form[method=dialog].
      const closedBy = reason
      reason = 'programmatic'
      opener = canFocus(opener) ? opener : null
      options.open.value = false
      restoreFocus()
      opener = null
      options.onClose?.(closedBy)
    },
    onPointerdown: (event) => {
      pressedOnBackdrop = event.target === options.element()
    },
    onClick: (event) => {
      // A click whose press and release both hit the dialog box itself is a
      // backdrop click (the panel covers the rest of the dialog).
      const onBackdrop = pressedOnBackdrop && event.target === options.element()
      pressedOnBackdrop = false
      if (onBackdrop && options.closeOnBackdrop()) close('backdrop')
    },
  }
}

export interface UsePopoverOptions {
  element: () => HTMLElement | null
  open: Ref<boolean>
}

export interface PopoverBindings {
  onBeforetoggle(event: Event): void
  onToggle(event: Event): void
  /** Bring an already open popover to the front of the top layer. */
  promote(): void
}

/** Keeps a boolean and a native `popover` element in sync (both directions). */
export const usePopover = (options: UsePopoverOptions): PopoverBindings => {
  /** Set from a closing `beforetoggle` until the popover shows again or `toggle` arrives. */
  let closing = false

  const isOpen = (element: HTMLElement): boolean => element.matches(':popover-open')

  const sync = (): void => {
    const element = options.element()
    if (!element?.isConnected) return
    if (options.open.value && !isOpen(element)) element.showPopover()
    // A popover that is already being hidden is not hidden a second time.
    else if (!options.open.value && isOpen(element) && !closing) element.hidePopover()
  }

  watch(options.open, sync, { flush: 'post' })
  onMounted(sync)
  onBeforeUnmount(() => {
    const element = options.element()
    if (element?.isConnected && isOpen(element)) element.hidePopover()
  })

  return {
    onBeforetoggle: (event) => {
      // Light dismiss and Escape close the popover natively. `toggle` reports
      // that a task later, so a key pressed in between (Escape, then Enter on
      // the trigger) would still see the popover as open; closing is mirrored
      // here, synchronously. Opening is not: the popover is not shown yet at
      // this point, and whatever reacts to it (moving focus in) has to wait.
      closing = (event as ToggleEvent).newState === 'closed'
      if (closing) options.open.value = false
    },
    onToggle: (event) => {
      closing = false
      options.open.value = (event as ToggleEvent).newState === 'open'
    },
    promote: () => {
      const element = options.element()
      if (!element?.isConnected || !isOpen(element)) return
      element.hidePopover()
      element.showPopover()
    },
  }
}
