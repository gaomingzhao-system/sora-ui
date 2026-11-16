import { nextTick, reactive } from 'vue'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { commands, page, userEvent } from 'vitest/browser'
import { mountVapor } from '../helpers/mount-vapor.ts'
import DrawerHarness from './harness/DrawerHarness.vue'
import type { DrawerState } from './harness/DrawerHarness.vue'
import { $, maybe, q, wait } from './support.ts'

/** A phone: the sheet's home. */
beforeAll(async () => {
  await page.viewport(390, 844)
})
afterAll(async () => {
  await page.viewport(1024, 768)
})

function setup(overrides: Partial<DrawerState> = {}) {
  const state = reactive<DrawerState>({
    open: false,
    keepOpen: false,
    snap: undefined,
    props: {},
    motion: 'none',
    events: [],
    closes: [],
    progress: [],
    items: 0,
    footer: false,
    header: false,
    nested: false,
    nestedOpen: false,
    ...overrides,
  })
  mountVapor(DrawerHarness, { props: { state } })
  return state
}

const dialog = (id = 'drawer'): HTMLDialogElement => q<HTMLDialogElement>(id)
const panel = (id = 'drawer'): HTMLElement => $('.sora-drawer__panel', dialog(id))
const backdrop = (id = 'drawer'): HTMLElement | null => dialog(id).querySelector('.sora-drawer__backdrop')

/** Visible share of a bottom sheet, from 0 to 1. */
function visibleShare(id = 'drawer'): number {
  const element = panel(id)
  return (window.innerHeight - element.getBoundingClientRect().top) / element.offsetHeight
}

async function open(state: DrawerState, props: DrawerState['props'] = {}): Promise<HTMLElement> {
  state.props = props
  state.open = true
  await expect.poll(() => state.events).toContain('opened')
  return panel()
}

const closed = (state: DrawerState): Promise<void> => expect.poll(() => state.events).toContain('closed')

/** Wait until the sheet stops moving. */
async function settle(id = 'drawer'): Promise<void> {
  let last = Number.NaN
  for (let index = 0; index < 100; index++) {
    await wait(32)
    const top = maybe(id) ? panel(id).getBoundingClientRect().top : -1
    if (top === last) return
    last = top
  }
}

interface DragOptions {
  /** Where the press starts, relative to the top-left corner of the element. */
  from?: { x: number; y: number }
  steps?: number
  /** Time (ms) between moves. */
  interval?: number
  /** Time (ms) the pointer rests before it is released. */
  hold?: number
  pointerType?: 'touch' | 'mouse'
}

/** Drag a pointer from a point of `element` by `dx`, `dy` and release it. */
async function drag(element: Element, dx: number, dy: number, options: DragOptions = {}): Promise<void> {
  const { steps = 10, interval = 16, hold = 0, pointerType = 'touch' } = options
  const rect = element.getBoundingClientRect()
  const x = rect.left + (options.from?.x ?? rect.width / 2)
  const y = rect.top + (options.from?.y ?? 10)
  const target = document.elementFromPoint(x, y) ?? element
  const fire = (type: string, clientX: number, clientY: number): void => {
    target.dispatchEvent(
      new PointerEvent(type, {
        bubbles: true,
        cancelable: true,
        composed: true,
        pointerId: 7,
        pointerType,
        isPrimary: true,
        button: type === 'pointermove' ? -1 : 0,
        clientX,
        clientY,
      }),
    )
  }
  fire('pointerdown', x, y)
  for (let step = 1; step <= steps; step++) {
    await wait(interval)
    fire('pointermove', x + (dx * step) / steps, y + (dy * step) / steps)
  }
  if (hold) await wait(hold)
  fire('pointerup', x + dx, y + dy)
  await nextTick()
}

/** Release slowly: the pointer rests long enough to drop its velocity. */
const slowly = { steps: 12, hold: 80 }
const thirds: DrawerState['props'] = { snapPoints: [1 / 3, 1 / 2, 1] }

describe('SoraDrawer: opening and closing', () => {
  it('opens as a native modal dialog at its first snap point, focused and named', async () => {
    const state = setup()
    q('trigger').focus()
    const element = await open(state, thirds)
    const sheet = dialog()
    expect(sheet.tagName).toBe('DIALOG')
    expect(sheet.matches(':modal')).toBe(true)
    expect(sheet.dataset['state']).toBe('open')
    expect(visibleShare()).toBeCloseTo(1 / 3, 2)
    // Named and described by its heading and text; focus starts on the sheet itself.
    expect(document.getElementById(sheet.getAttribute('aria-labelledby') ?? '')?.textContent?.trim()).toBe(
      'Nearby',
    )
    expect(document.getElementById(sheet.getAttribute('aria-describedby') ?? '')?.textContent?.trim()).toBe(
      'Places around you',
    )
    expect(document.activeElement).toBe(element)
    expect(backdrop()?.style.opacity).toBe('1')
    // The page behind is locked.
    expect(getComputedStyle(document.documentElement).overflow).toBe('hidden')
  })

  it('opens fully by default, like a large detent', async () => {
    const state = setup()
    await open(state)
    expect(visibleShare()).toBeCloseTo(1, 2)
    expect(dialog().hasAttribute('data-expanded')).toBe(true)
  })

  it('closes with Escape, restores focus and reports the reason', async () => {
    const state = setup()
    q('trigger').focus()
    await userEvent.click(q('trigger'))
    await expect.poll(() => state.events).toContain('opened')
    await userEvent.keyboard('{Escape}')
    await closed(state)
    expect(state.open).toBe(false)
    expect(state.closes).toEqual(['escape'])
    expect(dialog().open).toBe(false)
    expect(document.activeElement).toBe(q('trigger'))
    expect(getComputedStyle(document.documentElement).overflow).not.toBe('hidden')
  })

  it('closes on a backdrop tap', async () => {
    const state = setup()
    await open(state, thirds)
    backdrop()?.click()
    await closed(state)
    expect(state.closes).toEqual(['backdrop'])
  })

  it('closes from the slot prop, the footer and the close button', async () => {
    const state = setup({ footer: true })
    await open(state)
    q('inner-close').click()
    await closed(state)
    state.events = []
    await open(state)
    q('footer-close').click()
    await closed(state)
    state.events = []
    await open(state)
    $<HTMLButtonElement>('.sora-drawer__close', dialog()).click()
    await closed(state)
    expect(state.closes).toEqual(['action', 'action', 'action'])
  })

  it('stays open when the owner does not update v-model:open', async () => {
    const state = setup({ keepOpen: true })
    await open(state, thirds)
    await userEvent.keyboard('{Escape}')
    await settle()
    expect(dialog().open).toBe(true)
    expect(visibleShare()).toBeCloseTo(1 / 3, 2)
    expect(state.events).not.toContain('closed')
  })

  it('ignores Escape, backdrop taps and drags when not dismissible', async () => {
    const state = setup()
    const element = await open(state, { ...thirds, dismissible: false })
    expect(dialog().getAttribute('closedby')).toBe('none')
    expect(dialog().querySelector('.sora-drawer__close')).toBeNull()
    await userEvent.keyboard('{Escape}')
    backdrop()?.click()
    await drag(element, 0, 400, slowly)
    await settle()
    expect(state.open).toBe(true)
    expect(visibleShare()).toBeCloseTo(1 / 3, 2)
  })

  it('finishes cleanly when the dialog is closed natively', async () => {
    const state = setup()
    await open(state)
    dialog().close()
    await closed(state)
    expect(state.open).toBe(false)
  })

  it('survives being toggled open, closed and open in one tick', async () => {
    const state = setup()
    state.props = thirds
    state.open = true
    await nextTick()
    state.open = false
    await nextTick()
    state.open = true
    await expect.poll(() => state.events).toContain('opened')
    expect(visibleShare()).toBeCloseTo(1 / 3, 2)
    state.open = false
    await closed(state)
    expect(getComputedStyle(document.documentElement).overflow).not.toBe('hidden')
  })
})

describe('SoraDrawer: snap points', () => {
  it('follows v-model:snap-point', async () => {
    const state = setup()
    await open(state, thirds)
    state.snap = 1 / 2
    await settle()
    expect(visibleShare()).toBeCloseTo(1 / 2, 2)
    state.snap = 1
    await settle()
    expect(visibleShare()).toBeCloseTo(1, 2)
    expect(dialog().hasAttribute('data-expanded')).toBe(true)
    expect(q('slot-state').textContent).toBe('1 true')
  })

  it('opens at the bound snap point', async () => {
    const state = setup({ snap: 1 })
    await open(state, thirds)
    expect(visibleShare()).toBeCloseTo(1, 2)
  })

  it('drags to the nearest snap point and reports it', async () => {
    const state = setup()
    const element = await open(state, thirds)
    await drag(element, 0, -element.offsetHeight / 6, slowly)
    await settle()
    expect(state.snap).toBe(1 / 2)
    expect(visibleShare()).toBeCloseTo(1 / 2, 2)
  })

  it('skips ahead on a strong flick', async () => {
    const state = setup()
    const element = await open(state, thirds)
    await drag(element, 0, -300, { steps: 4, interval: 8 })
    await settle()
    expect(state.snap).toBe(1)
  })

  it('snaps back after a short drag', async () => {
    const state = setup()
    const element = await open(state, thirds)
    await drag(element, 0, 40, slowly)
    await settle()
    expect(state.open).toBe(true)
    expect(visibleShare()).toBeCloseTo(1 / 3, 2)
  })

  it('closes when dragged past the close threshold, as a drag', async () => {
    const state = setup()
    const element = await open(state, thirds)
    await drag(element, 0, 140, slowly)
    await closed(state)
    expect(state.open).toBe(false)
    expect(state.closes).toEqual(['drag'])
  })

  it('closes on a flick down from the smallest snap point', async () => {
    const state = setup()
    const element = await open(state, thirds)
    await drag(element, 0, 40, { steps: 3, interval: 8 })
    await closed(state)
  })

  it('rubber bands past the largest snap point', async () => {
    const state = setup()
    const element = await open(state)
    const top = element.getBoundingClientRect().top
    let overdrag = 0
    const observe = (): void => {
      overdrag = Math.max(overdrag, top - element.getBoundingClientRect().top)
    }
    // Drag writes land on the next animation frame; sample after each one.
    const sampler = setInterval(observe, 8)
    await drag(element, 0, -240, slowly)
    clearInterval(sampler)
    await settle()
    expect(overdrag).toBeGreaterThan(10)
    expect(overdrag).toBeLessThan(65)
    expect(element.getBoundingClientRect().top).toBeCloseTo(top, 0)
  })

  it('steps through the snap points with the handle, by tap and by keyboard', async () => {
    const state = setup()
    await open(state, thirds)
    const handle = $<HTMLButtonElement>('.sora-drawer__handle', dialog())
    expect(handle.tagName).toBe('BUTTON')
    expect(handle.getAttribute('aria-label')).toBe('Resize panel')
    handle.click()
    await settle()
    expect(state.snap).toBe(1 / 2)
    handle.click()
    await settle()
    expect(state.snap).toBe(1)
    handle.click()
    await settle()
    expect(state.snap).toBe(1 / 3)

    handle.focus()
    await userEvent.keyboard('{ArrowUp}')
    await settle()
    expect(state.snap).toBe(1 / 2)
    await userEvent.keyboard('{ArrowDown}')
    await settle()
    expect(state.snap).toBe(1 / 3)
    // Already at the smallest: no further.
    await userEvent.keyboard('{ArrowDown}')
    await settle()
    expect(state.snap).toBe(1 / 3)
  })

  it('has a decorative handle when there is nothing to step through', async () => {
    const state = setup()
    await open(state)
    const handle = $('.sora-drawer__handle', dialog())
    expect(handle.tagName).toBe('DIV')
    expect(handle.getAttribute('aria-hidden')).toBe('true')
  })

  it('returns to the first snap point after closing', async () => {
    const state = setup({ snap: 1 })
    await open(state, thirds)
    state.open = false
    await closed(state)
    expect(state.snap).toBe(1 / 3)
    state.events = []
    await open(state, thirds)
    expect(visibleShare()).toBeCloseTo(1 / 3, 2)
  })

  it('accepts pixel snap points', async () => {
    const state = setup()
    const element = await open(state, { snapPoints: ['200px', 1] })
    expect(window.innerHeight - element.getBoundingClientRect().top).toBeCloseTo(200, 0)
  })

  it('only scrolls its content once fully expanded', async () => {
    const state = setup({ items: 40 })
    await open(state, thirds)
    const body = $('.sora-drawer__body', dialog())
    expect(getComputedStyle(body).overflowY).toBe('hidden')
    expect(getComputedStyle(body).touchAction).toBe('none')
    state.snap = 1
    await settle()
    expect(getComputedStyle(body).overflowY).toBe('auto')
    expect(body.scrollHeight).toBeGreaterThan(body.clientHeight)
  })

  it('reports drag progress', async () => {
    const state = setup()
    const element = await open(state, thirds)
    await drag(element, 0, -100, slowly)
    expect(state.progress.length).toBeGreaterThan(3)
    expect(state.progress.at(-1)).toBeGreaterThan(state.progress[0] ?? 1)
    expect(state.progress.at(-1)).toBeCloseTo(1 / 3 + 100 / element.offsetHeight, 2)
  })

  it('only drags from the handle with handleOnly', async () => {
    const state = setup()
    const element = await open(state, { ...thirds, handleOnly: true })
    await drag(element, 0, -200, { ...slowly, from: { x: 40, y: 120 } })
    await settle()
    expect(visibleShare()).toBeCloseTo(1 / 3, 2)
    await drag(element, 0, -200, slowly)
    await settle()
    expect(state.snap).toBe(1 / 2)
  })

  it('does not press a button the drag ends over (real mouse input)', async () => {
    const state = setup()
    await open(state, thirds)
    const box = q('inner-close').getBoundingClientRect()
    const x = box.left + box.width / 2
    const y = box.top + box.height / 2
    // Press on the button, drag the sheet up by 40px and release: the button
    // moved with the sheet, so the release lands on it and the browser clicks it.
    await commands.mouseMove(x, y)
    await commands.mouseDown()
    await commands.mouseMove(x, y - 40, 8)
    await wait(80)
    await commands.mouseUp()
    await settle()
    expect(state.open).toBe(true)
    expect(state.events).not.toContain('closed')
    // A plain click afterwards still works.
    await userEvent.click(q('inner-close'))
    await closed(state)
  })
})

describe('SoraDrawer: layout', () => {
  it('fits its content with fit', async () => {
    const state = setup()
    const element = await open(state, { fit: true })
    expect(element.offsetHeight).toBeLessThan(window.innerHeight / 2)
    expect(visibleShare()).toBeCloseTo(1, 2)
  })

  it('slides in from the inline end, and from the other side in right-to-left', async () => {
    const state = setup()
    const element = await open(state, { side: 'end' })
    expect(Math.round(element.getBoundingClientRect().right)).toBe(window.innerWidth)
    expect(dialog().querySelector('.sora-drawer__handle')).toBeNull()
    await drag(element, 200, 0, { ...slowly, from: { x: 100, y: 200 } })
    await closed(state)

    document.documentElement.dir = 'rtl'
    try {
      state.events = []
      const mirrored = await open(state, { side: 'end' })
      expect(Math.round(mirrored.getBoundingClientRect().left)).toBe(0)
      await drag(mirrored, -200, 0, { ...slowly, from: { x: 100, y: 200 } })
      await closed(state)
    } finally {
      document.documentElement.removeAttribute('dir')
    }
  })

  it('comes from the top', async () => {
    const state = setup()
    const element = await open(state, { side: 'top', fit: true })
    expect(element.getBoundingClientRect().top).toBeCloseTo(0, 0)
    await drag(element, 0, -150, { ...slowly, from: { x: 100, y: element.offsetHeight - 12 } })
    await closed(state)
  })

  it('keeps the footer on screen at partial snap points', async () => {
    const state = setup({ footer: true })
    await open(state, thirds)
    const footer = $('.sora-drawer__footer', dialog())
    expect(footer.getBoundingClientRect().bottom).toBeCloseTo(window.innerHeight, 0)
  })

  it('replaces the title with the header slot and keeps the dialog named', async () => {
    const state = setup({ header: true })
    await open(state)
    expect(q('custom-header').textContent).toBe('Header true')
    expect(dialog().querySelector('.sora-drawer__title')).toBeNull()
    expect(dialog().getAttribute('aria-label')).toBe('Nearby')
  })

  it('passes attributes through to the dialog', () => {
    setup()
    const sheet = dialog()
    expect(sheet.classList.contains('sora-drawer')).toBe(true)
    expect(sheet.dataset['testid']).toBe('drawer')
    expect(sheet.dataset['side']).toBe('bottom')
  })
})

describe('SoraDrawer: the page around it', () => {
  it('keeps Tab inside a modal sheet', async () => {
    const state = setup()
    await open(state)
    for (let index = 0; index < 8; index++) {
      await userEvent.tab()
      const active = document.activeElement
      expect(active === document.body || dialog().contains(active), `after ${index + 1} tabs`).toBe(true)
    }
    q('outside').focus()
    expect(document.activeElement).not.toBe(q('outside'))
  })

  it('leaves the page usable when not modal', async () => {
    const state = setup()
    q('trigger').focus()
    await open(state, { modal: false, ...thirds })
    const sheet = dialog()
    expect(sheet.matches(':modal')).toBe(false)
    expect(sheet.matches(':popover-open')).toBe(true)
    expect(backdrop()).toBeNull()
    // Focus stays where it was and the page still takes input.
    expect(document.activeElement).toBe(q('trigger'))
    q('outside').focus()
    expect(document.activeElement).toBe(q('outside'))
    expect(getComputedStyle(document.documentElement).overflow).not.toBe('hidden')
    // Escape works while focus is inside it.
    panel().focus()
    await userEvent.keyboard('{Escape}')
    await closed(state)
  })

  it('pushes the page back at the largest snap point with scaleBackground', async () => {
    const state = setup()
    const background = q('page')
    await open(state, { ...thirds, scaleBackground: true })
    expect(background.style.transform).toContain('scale(1)')
    state.snap = 1
    await settle()
    expect(background.style.transform).toMatch(/scale\(0\.9\d+\)/)
    expect(background.style.clipPath).toContain('round 10px')
    expect(document.documentElement.hasAttribute('data-sora-drawer-scaled')).toBe(true)
    state.open = false
    await closed(state)
    expect(background.style.transform).toBe('')
    expect(background.style.clipPath).toBe('')
    expect(document.documentElement.hasAttribute('data-sora-drawer-scaled')).toBe(false)
  })

  it('pushes back the sheet it is nested in, and brings it forward again', async () => {
    const state = setup({ nested: true })
    const element = await open(state)
    q('open-nested').click()
    await expect.poll(() => dialog('nested').open).toBe(true)
    await expect.poll(() => element.style.transform).toContain('scale(')
    await userEvent.keyboard('{Escape}')
    await expect.poll(() => dialog('nested').open).toBe(false)
    expect(element.style.transform).not.toContain('scale(')
    expect(state.open).toBe(true)
    expect(dialog().open).toBe(true)
  })
})

describe('SoraDrawer: motion', () => {
  it('flies on the compositor with the motion tokens, and lands on inline styles', async () => {
    const state = setup({ motion: 'subtle' })
    state.props = thirds
    state.open = true
    await expect.poll(() => panel().getAnimations().length).toBeGreaterThan(0)
    expect(dialog().hasAttribute('data-moving')).toBe(true)
    expect(state.events).not.toContain('opened')
    await expect.poll(() => state.events, { timeout: 3000 }).toContain('opened')
    expect(panel().getAnimations()).toHaveLength(0)
    expect(dialog().hasAttribute('data-moving')).toBe(false)
    expect(visibleShare()).toBeCloseTo(1 / 3, 2)
  })

  it('can be caught mid-flight and released where it is', async () => {
    const state = setup({ motion: 'subtle' })
    state.props = thirds
    state.open = true
    await expect.poll(() => panel().getAnimations().length).toBeGreaterThan(0)
    await wait(60)
    const element = panel()
    const top = element.getBoundingClientRect().top
    element.dispatchEvent(
      new PointerEvent('pointerdown', {
        bubbles: true,
        pointerId: 3,
        isPrimary: true,
        clientX: 100,
        clientY: top + 10,
      }),
    )
    await wait(80)
    // Frozen where the finger caught it.
    expect(element.getAnimations()).toHaveLength(0)
    expect(Math.abs(element.getBoundingClientRect().top - top)).toBeLessThan(40)
    window.dispatchEvent(new PointerEvent('pointerup', { pointerId: 3, isPrimary: true }))
    await expect.poll(() => state.events, { timeout: 3000 }).toContain('opened')
    expect(visibleShare()).toBeCloseTo(1 / 3, 2)
  })

  it('moves instantly with reduced motion', async () => {
    const state = setup({ motion: 'none' })
    state.props = thirds
    state.open = true
    await nextTick()
    await nextTick()
    expect(panel().getAnimations()).toHaveLength(0)
    await expect.poll(() => state.events).toContain('opened')
  })
})
