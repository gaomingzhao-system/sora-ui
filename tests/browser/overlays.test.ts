import { nextTick, reactive } from 'vue'
import { describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { mountVapor } from '../helpers/mount-vapor.ts'
import OverlaysHarness, { type OverlaysState } from './harness/OverlaysHarness.vue'
import { $, all, description, flush, press, q, referenced, until, wait } from './support.ts'

const setup = (overrides: Partial<OverlaysState> = {}) => {
  const state = reactive<OverlaysState>({
    dialogOpen: false,
    closeOnEscape: true,
    closeOnBackdrop: true,
    closes: [],
    showTrigger: true,
    showDialog: true,
    useReturnFocus: false,
    popoverOpen: false,
    manualOpen: false,
    customOpen: false,
    menuOpen: false,
    selected: [],
    ran: [],
    tooltipDisabled: false,
    nestedOpen: false,
    fruit: null,
    ...overrides,
  })
  const view = mountVapor(OverlaysHarness, { props: { state } })
  const exposed = view.app._instance?.exposed as {
    dialog(): { close(): void; element: HTMLDialogElement | null } | null
  }
  return { state, view, exposed }
}

const isPopoverOpen = (element: Element): boolean => element.matches(':popover-open')

/** A click whose press and release both land on the dialog box itself, i.e. on its backdrop. */
const clickBackdrop = (dialog: HTMLDialogElement): void => {
  dialog.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
  dialog.dispatchEvent(new MouseEvent('click', { bubbles: true }))
}

describe('SoraDialog', () => {
  it('opens as a native modal dialog that is labelled and described', async () => {
    const { state } = setup()
    const dialog = q<HTMLDialogElement>('dialog')
    expect(dialog.tagName).toBe('DIALOG')
    expect(dialog.open).toBe(false)

    q('dialog-trigger').focus()
    await userEvent.click(q('dialog-trigger'))
    await flush()
    expect(state.dialogOpen).toBe(true)
    expect(dialog.open).toBe(true)
    // showModal(), not just the `open` attribute: top layer and inert page.
    expect(dialog.matches(':modal')).toBe(true)
    expect(referenced(dialog, 'aria-labelledby')[0]?.textContent).toBe('Settings')
    expect(description(dialog)).toBe('Adjust the workspace')
    expect($('.sora-dialog__title', dialog).tagName).toBe('H2')
    expect($<HTMLButtonElement>('.sora-dialog__close', dialog).getAttribute('aria-label')).toBe('Close')
  })

  it('moves focus to [data-autofocus] and never lets Tab reach the page behind', async () => {
    const { state } = setup()
    const dialog = q<HTMLDialogElement>('dialog')
    q('dialog-trigger').focus()
    state.dialogOpen = true
    await flush()
    expect(document.activeElement).toBe(q('dialog-auto'))
    await press('{Tab}')
    expect(document.activeElement).toBe(q('dialog-done'))
    // A native modal dialog makes the rest of the page inert. Tab may travel on
    // to the browser's own UI (the document then reports <body>) and back into
    // the dialog, but it can never land on an element behind it.
    for (let index = 0; index < 8; index++) {
      await press('{Tab}')
      const active = document.activeElement
      expect(active === document.body || dialog.contains(active), `after ${index + 2} tabs`).toBe(true)
    }
    q('dialog-first').focus()
    await press('{Shift>}{Tab}{/Shift}')
    expect(document.activeElement).toBe($('.sora-dialog__close', dialog))
    // The page behind a modal dialog cannot be focused, not even from script.
    q('after').focus()
    expect(document.activeElement).not.toBe(q('after'))
    q('dialog-trigger').focus()
    expect(document.activeElement).not.toBe(q('dialog-trigger'))
  })

  it('Escape closes it, syncs the model, reports the reason and restores focus', async () => {
    const { state } = setup()
    const trigger = q('dialog-trigger')
    trigger.focus()
    await userEvent.click(trigger)
    await flush()
    await press('{Escape}')
    await flush()
    expect(q<HTMLDialogElement>('dialog').open).toBe(false)
    expect(state.dialogOpen).toBe(false)
    expect(state.closes).toEqual(['escape'])
    expect(document.activeElement).toBe(trigger)
  })

  it('ignores Escape when closeOnEscape is false', async () => {
    const { state } = setup({ closeOnEscape: false })
    const dialog = q<HTMLDialogElement>('dialog')
    expect(dialog.getAttribute('closedby')).toBe('none')
    state.dialogOpen = true
    await flush()
    await press('{Escape}')
    await flush()
    expect(dialog.open).toBe(true)
    expect(state.dialogOpen).toBe(true)
    expect(state.closes).toEqual([])
  })

  it('closes on a backdrop click only when allowed, and never on a click inside', async () => {
    const { state } = setup()
    const dialog = q<HTMLDialogElement>('dialog')
    state.dialogOpen = true
    await flush()
    await userEvent.click(q('dialog-first'))
    expect(dialog.open).toBe(true)
    // A drag that starts inside and ends on the backdrop is not a backdrop click.
    q('dialog-first').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    dialog.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await flush()
    expect(dialog.open).toBe(true)

    clickBackdrop(dialog)
    await flush()
    expect(dialog.open).toBe(false)
    expect(state.closes).toEqual(['backdrop'])

    state.closeOnBackdrop = false
    state.dialogOpen = true
    await flush()
    clickBackdrop(dialog)
    await flush()
    expect(dialog.open).toBe(true)
  })

  it('closes from the header button, a footer slot action, the exposed method and the model', async () => {
    const { state, exposed } = setup()
    const dialog = q<HTMLDialogElement>('dialog')
    const reopen = async (): Promise<void> => {
      state.dialogOpen = true
      await flush()
      expect(dialog.open).toBe(true)
    }
    await reopen()
    await userEvent.click($('.sora-dialog__close', dialog))
    await flush()
    expect(dialog.open).toBe(false)

    await reopen()
    await userEvent.click(q('dialog-done'))
    await flush()
    expect(dialog.open).toBe(false)

    await reopen()
    exposed.dialog()?.close()
    await flush()
    expect(state.dialogOpen).toBe(false)
    expect(exposed.dialog()?.element).toBe(dialog)

    await reopen()
    state.dialogOpen = false
    await flush()
    expect(dialog.open).toBe(false)
    expect(state.closes).toEqual(['action', 'action', 'action', 'programmatic'])
  })

  it('stays consistent through rapid toggling and a native close()', async () => {
    const { state } = setup()
    const dialog = q<HTMLDialogElement>('dialog')
    state.dialogOpen = true
    state.dialogOpen = false
    state.dialogOpen = true
    await flush()
    expect(dialog.open).toBe(true)
    expect(state.dialogOpen).toBe(true)

    for (let index = 0; index < 5; index++) {
      state.dialogOpen = !state.dialogOpen
      await nextTick()
    }
    await flush()
    expect(dialog.open).toBe(state.dialogOpen)

    // Closed by something that is not the component (e.g. form[method=dialog]).
    state.dialogOpen = true
    await flush()
    dialog.close()
    await flush()
    expect(state.dialogOpen).toBe(false)
  })

  it('sends focus somewhere sensible when the opener no longer exists', async () => {
    const { state } = setup()
    const trigger = q('dialog-trigger')
    trigger.focus()
    await userEvent.click(trigger)
    await flush()
    state.showTrigger = false
    await nextTick()
    await press('{Escape}')
    await flush()
    // The nearest focusable ancestor of the dialog, not <body>.
    expect(document.activeElement).toBe(q('focusable-ancestor'))
  })

  it('returnFocus overrides where focus goes on close', async () => {
    const { state } = setup({ useReturnFocus: true })
    q('dialog-trigger').focus()
    state.dialogOpen = true
    await flush()
    await press('{Escape}')
    await flush()
    expect(document.activeElement).toBe(q('fallback'))
  })

  it('closes itself when unmounted so the page does not stay inert', async () => {
    const { state } = setup()
    state.dialogOpen = true
    await flush()
    expect(document.querySelector('dialog:modal')).not.toBeNull()
    state.showDialog = false
    await flush()
    expect(document.querySelector('dialog:modal')).toBeNull()
    q('after').focus()
    expect(document.activeElement).toBe(q('after'))
  })
})

describe('SoraPopover', () => {
  it('has a library-owned trigger button wired to a named, non-modal panel', async () => {
    const { state } = setup()
    const trigger = q<HTMLButtonElement>('popover-trigger')
    expect(trigger.tagName).toBe('BUTTON')
    expect(trigger.textContent?.trim()).toBe('Share')
    const panel = referenced(trigger, 'aria-controls')[0] as HTMLElement
    expect(panel.getAttribute('popover')).toBe('auto')
    expect(panel.getAttribute('role')).toBe('dialog')
    expect(referenced(panel, 'aria-labelledby')[0]?.textContent).toBe('Share this page')
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    expect(trigger.getAttribute('aria-haspopup')).toBe('dialog')

    await userEvent.click(trigger)
    await flush()
    expect(state.popoverOpen).toBe(true)
    expect(isPopoverOpen(panel)).toBe(true)
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    // The panel follows the trigger in the DOM, so Tab moves into it.
    expect(trigger.nextElementSibling).toBe(panel)
  })

  it('is anchored to its trigger with CSS anchor positioning', async () => {
    const { state } = setup()
    const trigger = q('popover-trigger')
    const panel = referenced(trigger, 'aria-controls')[0] as HTMLElement
    state.popoverOpen = true
    await flush()
    const anchor = trigger.getBoundingClientRect()
    const box = panel.getBoundingClientRect()
    expect(getComputedStyle(panel).positionAnchor).toBe(trigger.style.getPropertyValue('anchor-name'))
    expect(box.top - anchor.bottom).toBeGreaterThanOrEqual(0)
    expect(box.top - anchor.bottom).toBeLessThan(10)
    expect(Math.abs(box.left - anchor.left)).toBeLessThan(2)
  })

  it('closes on Escape (returning focus), on an outside click, and from its slot', async () => {
    const { state } = setup()
    const trigger = q('popover-trigger')
    const panel = referenced(trigger, 'aria-controls')[0] as HTMLElement
    trigger.focus()
    await userEvent.click(trigger)
    await flush()
    q('popover-inner').focus()
    await press('{Escape}')
    await flush()
    expect(state.popoverOpen).toBe(false)
    expect(document.activeElement).toBe(trigger)

    await userEvent.click(trigger)
    await flush()
    await userEvent.click(q('after'))
    await flush()
    expect(state.popoverOpen).toBe(false)
    expect(isPopoverOpen(panel)).toBe(false)

    state.popoverOpen = true
    await flush()
    await userEvent.click(q('popover-inner'))
    await flush()
    expect(state.popoverOpen).toBe(false)
  })

  it('dismiss="manual" only closes through the model', async () => {
    const { state } = setup()
    const trigger = q('manual-trigger')
    const panel = referenced(trigger, 'aria-controls')[0] as HTMLElement
    expect(panel.getAttribute('popover')).toBe('manual')
    // Without a title or label it is a plain disclosure, not a dialog.
    expect(panel.hasAttribute('role')).toBe(false)
    expect(trigger.hasAttribute('aria-haspopup')).toBe(false)
    await userEvent.click(trigger)
    await flush()
    await userEvent.click(q('after'))
    await press('{Escape}')
    await flush()
    expect(isPopoverOpen(panel)).toBe(true)
    await userEvent.click(trigger)
    await flush()
    expect(state.manualOpen).toBe(false)
  })

  it('supports a custom trigger through explicit attribute, listener and ref bindings', async () => {
    const { state } = setup()
    const trigger = q<HTMLButtonElement>('custom-trigger')
    const panel = referenced(trigger, 'aria-controls')[0] as HTMLElement
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    expect(panel.getAttribute('aria-label')).toBe('Custom panel')
    expect(trigger.style.getPropertyValue('anchor-name')).toMatch(/^--/)
    await userEvent.click(trigger)
    await flush()
    expect(state.customOpen).toBe(true)
    expect(trigger.textContent).toBe('close')
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    expect(isPopoverOpen(panel)).toBe(true)
  })
})

describe('SoraTooltip', () => {
  const tooltip = (): HTMLElement => $('[role="tooltip"]')

  it('describes the focusable control and shows immediately on keyboard focus', async () => {
    setup()
    const trigger = q('tooltip-trigger')
    expect(description(trigger)).toBe('Copies the link')
    expect(tooltip().getAttribute('popover')).toBe('hint')
    expect(isPopoverOpen(tooltip())).toBe(false)

    q('fallback').focus()
    // Reach the trigger with the keyboard, so it matches :focus-visible.
    while (document.activeElement !== trigger) await press('{Tab}')
    await flush()
    expect(isPopoverOpen(tooltip())).toBe(true)
    // Positioned next to its trigger, not over it.
    const anchor = trigger.getBoundingClientRect()
    const box = tooltip().getBoundingClientRect()
    expect(box.bottom <= anchor.top + 1 || box.top >= anchor.bottom - 1).toBe(true)

    await press('{Tab}')
    await until(() => !isPopoverOpen(tooltip()))
  })

  it('Escape dismisses it while the trigger keeps focus', async () => {
    setup()
    const trigger = q('tooltip-trigger')
    q('fallback').focus()
    while (document.activeElement !== trigger) await press('{Tab}')
    await flush()
    expect(isPopoverOpen(tooltip())).toBe(true)
    await press('{Escape}')
    expect(isPopoverOpen(tooltip())).toBe(false)
    expect(document.activeElement).toBe(trigger)
  })

  it('shows on hover after a delay and stays while the pointer is on the tooltip itself', async () => {
    setup()
    const wrapper = q('tooltip-wrapper')
    wrapper.dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'mouse' }))
    expect(isPopoverOpen(tooltip())).toBe(false)
    await until(() => isPopoverOpen(tooltip()))

    // Pointer leaves the trigger and lands on the tooltip: it must persist (WCAG 1.4.13).
    wrapper.dispatchEvent(new PointerEvent('pointerleave', { pointerType: 'mouse' }))
    tooltip().dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'mouse' }))
    await wait(200)
    expect(isPopoverOpen(tooltip())).toBe(true)

    tooltip().dispatchEvent(new PointerEvent('pointerleave', { pointerType: 'mouse' }))
    await until(() => !isPopoverOpen(tooltip()))
  })

  it('ignores touch hover and never opens while disabled', async () => {
    const { state } = setup()
    const wrapper = q('tooltip-wrapper')
    wrapper.dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'touch' }))
    await wait(150)
    expect(isPopoverOpen(tooltip())).toBe(false)

    state.tooltipDisabled = true
    await nextTick()
    wrapper.dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'mouse' }))
    await wait(150)
    expect(isPopoverOpen(tooltip())).toBe(false)
  })

  it('removes its document listener and timers on unmount', async () => {
    const { view } = setup()
    q('tooltip-wrapper').dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'mouse' }))
    await until(() => isPopoverOpen(tooltip()))
    view.unmount()
    // Would throw or leak if the keydown listener still ran against a dead component.
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await wait(100)
  })
})

describe('SoraDropdownMenu', () => {
  const menu = (): HTMLElement => referenced(q('menu-trigger'), 'aria-controls')[0] as HTMLElement
  const items = (): HTMLElement[] => all('[role="menuitem"]', menu())
  const focused = (): string =>
    document.activeElement?.querySelector('.sora-menu__text')?.textContent?.trim() ?? ''

  it('follows the menu-button pattern', async () => {
    setup()
    const trigger = q<HTMLButtonElement>('menu-trigger')
    expect(trigger.getAttribute('aria-haspopup')).toBe('menu')
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    expect(menu().getAttribute('role')).toBe('menu')
    // Named by its trigger.
    expect(referenced(menu(), 'aria-labelledby')[0]).toBe(trigger)
    expect(items().map((item) => item.querySelector('.sora-menu__text')?.textContent?.trim())).toEqual([
      'Edit',
      'Duplicate',
      'Move',
      'Documentation',
      'Archive',
      'Delete',
    ])
    // Items are out of the page Tab order; the menu manages focus itself.
    expect(items().every((item) => item.tabIndex === -1)).toBe(true)
    expect(items()[2]?.getAttribute('aria-disabled')).toBe('true')
    expect(items()[0]?.getAttribute('aria-keyshortcuts')).toBe('E')
    // Link items are real anchors.
    expect(items()[3]?.tagName).toBe('A')
    expect(items()[3]?.getAttribute('href')).toBe('#docs')
    // Groups are labelled and separated.
    const groups = all('[role="group"]', menu())
    expect(groups.map((group) => group.getAttribute('aria-label'))).toEqual([null, 'Danger zone'])
    // Groups are divided by a native rule (<hr>, an implicit separator).
    expect(all('hr', menu())).toHaveLength(1)
    // The trigger is a native invoker of the menu.
    expect(q('menu-trigger').getAttribute('popovertarget')).toBe(menu().id)
  })

  it('opens on click with focus on the first item', async () => {
    const { state } = setup()
    await userEvent.click(q('menu-trigger'))
    await flush()
    expect(state.menuOpen).toBe(true)
    expect(isPopoverOpen(menu())).toBe(true)
    expect(q('menu-trigger').getAttribute('aria-expanded')).toBe('true')
    expect(focused()).toBe('Edit')
  })

  it('moves focus into the menu at once, so a quick key sequence never acts on the trigger', async () => {
    const { state } = setup()
    q('menu-trigger').focus()
    // One uninterrupted sequence: open, move to the second item, activate it.
    await userEvent.keyboard('{Enter}{ArrowDown}{Enter}')
    await flush()
    expect(state.selected).toEqual(['duplicate'])
    expect(state.menuOpen).toBe(false)
    expect(document.activeElement).toBe(q('menu-trigger'))

    // Opening through the model moves focus without waiting for the popover's toggle event.
    state.menuOpen = true
    await nextTick()
    expect(focused()).toBe('Edit')
  })

  it('mirrors a native close at once, so Enter right after it opens the menu again', async () => {
    const { state } = setup()
    const trigger = q('menu-trigger')
    trigger.focus()
    await press('{Enter}')
    await flush()
    expect(isPopoverOpen(menu())).toBe(true)

    // Light dismiss and Escape close the popover natively; its `toggle` event follows a task later.
    menu().hidePopover()
    expect(state.menuOpen).toBe(false)
    // Vue flushes, but the queued `toggle` event has not been dispatched yet when the next key arrives.
    await nextTick()
    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }))
    await flush()
    expect(isPopoverOpen(menu())).toBe(true)
    expect(state.menuOpen).toBe(true)
    expect(focused()).toBe('Edit')
  })

  it('opens from the keyboard: ArrowDown on the first item, ArrowUp on the last', async () => {
    setup()
    const trigger = q('menu-trigger')
    trigger.focus()
    await press('{ArrowDown}')
    await flush()
    expect(focused()).toBe('Edit')
    await press('{Escape}')
    await flush()
    expect(document.activeElement).toBe(trigger)
    await press('{ArrowUp}')
    await flush()
    expect(focused()).toBe('Delete')
  })

  it('navigates with arrows (wrapping), Home/End and typeahead; disabled items stay reachable', async () => {
    setup()
    q('menu-trigger').focus()
    await press('{Enter}')
    await flush()
    expect(focused()).toBe('Edit')
    await press('{ArrowDown}{ArrowDown}')
    // Disabled items can be focused (so they can be discovered)...
    expect(focused()).toBe('Move')
    await press('{End}')
    expect(focused()).toBe('Delete')
    await press('{ArrowDown}')
    expect(focused()).toBe('Edit')
    await press('{ArrowUp}')
    expect(focused()).toBe('Delete')
    await press('{Home}')
    expect(focused()).toBe('Edit')
    // Typeahead: one character, then cycling, then a longer prefix.
    await press('d')
    expect(focused()).toBe('Duplicate')
    await press('d')
    expect(focused()).toBe('Documentation')
    await wait(700)
    await press('ar')
    expect(focused()).toBe('Archive')
  })

  it('activating an item runs it, emits select, closes the menu and returns focus', async () => {
    const { state } = setup()
    const trigger = q('menu-trigger')
    trigger.focus()
    await press('{Enter}')
    await flush()
    await press('{Enter}')
    await flush()
    expect(state.ran).toEqual(['edit'])
    expect(state.selected).toEqual(['edit'])
    expect(state.menuOpen).toBe(false)
    expect(document.activeElement).toBe(trigger)

    await userEvent.click(trigger)
    await flush()
    await userEvent.click(items()[1] as HTMLElement)
    await flush()
    expect(state.selected).toEqual(['edit', 'duplicate'])
  })

  it('...but a disabled item cannot be activated', async () => {
    const { state } = setup()
    q('menu-trigger').focus()
    await press('{Enter}')
    await flush()
    await press('{ArrowDown}{ArrowDown}{Enter}')
    await press(' ')
    await userEvent.click(items()[2] as HTMLElement, { force: true })
    await flush()
    expect(state.selected).toEqual([])
    expect(state.menuOpen).toBe(true)
  })

  it('Escape closes and returns focus; Tab closes and moves on; an outside click closes', async () => {
    const { state } = setup()
    const trigger = q('menu-trigger')
    trigger.focus()
    await press('{Enter}')
    await flush()
    await press('{Escape}')
    await flush()
    expect(state.menuOpen).toBe(false)
    expect(document.activeElement).toBe(trigger)

    await press('{Enter}')
    await flush()
    await press('{Tab}')
    await flush()
    expect(state.menuOpen).toBe(false)
    expect(menu().contains(document.activeElement)).toBe(false)
    expect(document.activeElement).not.toBe(trigger)

    await userEvent.click(trigger)
    await flush()
    await userEvent.click(q('after'))
    await flush()
    expect(state.menuOpen).toBe(false)
  })

  it('hovering an item moves the single highlight (focus) to it', async () => {
    setup()
    await userEvent.click(q('menu-trigger'))
    await flush()
    await userEvent.hover(items()[4] as HTMLElement)
    await flush()
    expect(focused()).toBe('Archive')
  })
})

describe('overlays inside a modal dialog', () => {
  it('a combobox popup opens above the dialog, is operable, and Escape closes only the popup', async () => {
    const { state } = setup()
    await userEvent.click(q('nested-trigger'))
    await flush()
    const dialog = q<HTMLDialogElement>('nested-dialog')
    const input = q<HTMLInputElement>('nested-combobox')
    const popup = $('.sora-combobox__popup', dialog)
    input.focus()
    await press('{ArrowDown}')
    await flush()
    expect(isPopoverOpen(popup)).toBe(true)
    // The popup is a DOM descendant of the dialog, so it is not inert.
    expect(dialog.contains(popup)).toBe(true)

    await press('{Escape}')
    await flush()
    expect(isPopoverOpen(popup)).toBe(false)
    expect(dialog.open).toBe(true)

    await press('{ArrowDown}')
    await flush()
    await userEvent.click(all('[role="option"]', popup)[1] as HTMLElement)
    expect(state.fruit).toBe('cherry')
    expect(dialog.open).toBe(true)
  })

  it('a menu inside the dialog works and returns focus to its trigger, not to the page', async () => {
    const { state } = setup()
    await userEvent.click(q('nested-trigger'))
    await flush()
    const dialog = q<HTMLDialogElement>('nested-dialog')
    const trigger = q('nested-menu')
    trigger.focus()
    await press('{Enter}')
    await flush()
    const menu = referenced(trigger, 'aria-controls')[0] as HTMLElement
    expect(isPopoverOpen(menu)).toBe(true)
    await press('{ArrowDown}{Enter}')
    await flush()
    expect(state.selected).toEqual(['duplicate'])
    expect(document.activeElement).toBe(trigger)
    expect(dialog.open).toBe(true)
  })

  it('Escape on a tooltip inside the dialog dismisses the tooltip, not the dialog', async () => {
    setup()
    await userEvent.click(q('nested-trigger'))
    await flush()
    const dialog = q<HTMLDialogElement>('nested-dialog')
    const trigger = q('nested-tooltip')
    q<HTMLInputElement>('nested-combobox').focus()
    while (document.activeElement !== trigger) await press('{Tab}')
    await flush()
    const tooltip = referenced(trigger, 'aria-describedby')[0] as HTMLElement
    expect(isPopoverOpen(tooltip)).toBe(true)
    await press('{Escape}')
    await flush()
    expect(isPopoverOpen(tooltip)).toBe(false)
    expect(dialog.open).toBe(true)
    // A second Escape now reaches the dialog.
    await press('{Escape}')
    await flush()
    expect(dialog.open).toBe(false)
  })

  it('theme tokens and direction reach top-layer content through its real DOM ancestors', async () => {
    const view = mountVapor(OverlaysHarness, {
      props: { state: reactive(setup().state) },
      containerAttrs: { dir: 'rtl', 'data-sora-theme': 'dark', style: '--sora-pad-overlay: 2rem' },
    })
    const dialog = q<HTMLDialogElement>('dialog', view.container)
    dialog.showModal()
    await flush()
    const style = getComputedStyle(dialog)
    expect(style.direction).toBe('rtl')
    expect(style.colorScheme).toBe('dark')
    expect(getComputedStyle($('.sora-dialog__body', dialog)).paddingInlineStart).toBe('32px')
    dialog.close()
  })
})
