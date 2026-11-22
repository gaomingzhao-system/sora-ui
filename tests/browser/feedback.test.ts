import { nextTick, reactive } from 'vue'
import { describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { mountVapor } from '../helpers/mount-vapor.ts'
import FeedbackHarness, { type FeedbackState } from './harness/FeedbackHarness.vue'
import ToastOrphan from './harness/ToastOrphan.vue'
import { $, all, flush, q, until, wait } from './support.ts'

const setup = (overrides: Partial<FeedbackState> = {}) => {
  const state = reactive<FeedbackState>({
    alertOpen: true,
    lateAlertOpen: false,
    dismissed: 0,
    progress: 40,
    duration: 60_000,
    max: 3,
    actions: [],
    showProvider: true,
    ...overrides,
  })
  mountVapor(FeedbackHarness, { props: { state } })
  const region = (): HTMLElement => $('.sora-toast-region')
  const toasts = (): string[] => all('.sora-toast__title').map((title) => title.textContent ?? '')
  return { state, region, toasts }
}

describe('SoraAlert', () => {
  it('chooses a live-region role from the intent, or none for static notes', () => {
    setup()
    expect(q('alert-info').getAttribute('role')).toBe('status')
    expect(q('alert-error').getAttribute('role')).toBe('alert')
    expect(q('alert-static').hasAttribute('role')).toBe(false)
  })

  it('conveys the intent with text and an icon, never colour alone', () => {
    setup()
    const info = q('alert-info')
    expect($('.sora-alert__title', info).textContent?.trim()).toBe('Heads up')
    expect($('.sora-alert__description', info).textContent?.trim()).toBe('Trial ends soon.')
    expect($('.sora-alert__icon', info).getAttribute('aria-hidden')).toBe('true')
    expect($('.sora-alert__icon svg', info)).not.toBeNull()
    // `icon: null` removes the glyph; the default slot replaces the description.
    expect(q('alert-static').querySelector('.sora-alert__icon')).toBeNull()
    expect($('.sora-alert__description', q('alert-error')).textContent?.trim()).toBe('Payment failed.')
  })

  it('dismisses through v-model:open with a named button, and can be reopened', async () => {
    const { state } = setup()
    const alert = q('alert-dismissible')
    expect(q('alert-action').closest('.sora-alert__actions')).not.toBeNull()
    const dismiss = $<HTMLButtonElement>('.sora-alert__dismiss', alert)
    expect(dismiss.getAttribute('aria-label')).toBe('Dismiss alert')
    await userEvent.click(dismiss)
    expect(state.alertOpen).toBe(false)
    expect(state.dismissed).toBe(1)
    expect(document.querySelector('[data-testid="alert-dismissible"]')).toBeNull()

    state.alertOpen = true
    await nextTick()
    expect(q('alert-dismissible').getAttribute('role')).toBe('status')
  })

  it('applies caller attributes to its root, also when it is mounted closed and opened later', async () => {
    const { state } = setup()
    // Closed: nothing is rendered (and no "extraneous attributes" warning: tests/browser/console.ts).
    expect(document.querySelector('[data-testid="alert-late"]')).toBeNull()
    state.lateAlertOpen = true
    await nextTick()
    const alert = q('alert-late')
    expect(alert.classList.contains('sora-alert')).toBe(true)
    expect(alert.classList.contains('from-caller')).toBe(true)
    expect(alert.getAttribute('role')).toBe('status')
  })
})

describe('SoraSpinner', () => {
  it('is a status with a translated or custom label, unless decorative', () => {
    setup()
    const spinner = q('spinner')
    expect(spinner.getAttribute('role')).toBe('status')
    expect($('.sora-sr-only', spinner).textContent).toBe('Loading')
    expect($('.sora-spinner__ring', spinner).getAttribute('aria-hidden')).toBe('true')
    expect($('.sora-sr-only', q('spinner-custom')).textContent).toBe('Uploading files')

    const decorative = q('spinner-decorative')
    expect(decorative.getAttribute('aria-hidden')).toBe('true')
    expect(decorative.hasAttribute('role')).toBe(false)
    expect(decorative.querySelector('.sora-sr-only')).toBeNull()
  })
})

describe('SoraProgress', () => {
  it('is a native progress element named by its visible label', () => {
    setup()
    const bar = $<HTMLProgressElement>('progress', q('progress'))
    expect(bar.value).toBe(40)
    expect(bar.max).toBe(100)
    expect(bar.getAttribute('aria-valuetext')).toBe('40%')
    const label = document.getElementById(bar.getAttribute('aria-labelledby') ?? '')
    expect(label?.textContent).toBe('Upload')
    expect($('.sora-progress__value', q('progress')).textContent).toBe('40%')
  })

  it('becomes indeterminate when there is no value, and clamps out-of-range values', async () => {
    const { state } = setup()
    const bar = $<HTMLProgressElement>('progress', q('progress'))
    state.progress = null
    await nextTick()
    // No `value` attribute is what makes a progress element indeterminate.
    expect(bar.hasAttribute('value')).toBe(false)
    expect(bar.position).toBe(-1)
    expect(bar.matches(':indeterminate')).toBe(true)
    expect(bar.hasAttribute('aria-valuetext')).toBe(false)
    expect(q('progress').querySelector('.sora-progress__value')).toBeNull()

    state.progress = 250
    await nextTick()
    expect(bar.value).toBe(100)
    state.progress = -5
    await nextTick()
    expect(bar.value).toBe(0)
  })

  it('has a translated name when there is no visible label, and honours max', () => {
    setup()
    const bar = $<HTMLProgressElement>('progress', q('progress-unnamed'))
    expect(bar.getAttribute('aria-label')).toBe('Progress')
    expect(bar.max).toBe(20)
    expect(bar.getAttribute('aria-valuetext')).toBe('25%')
  })
})

describe('SoraSkeleton', () => {
  it('is decorative by default and can announce a loading status', () => {
    setup()
    const skeleton = q('skeleton')
    expect(skeleton.getAttribute('aria-hidden')).toBe('true')
    expect(all('.sora-skeleton__block', skeleton)).toHaveLength(3)
    const status = q('skeleton-status')
    expect(status.getAttribute('role')).toBe('status')
    expect($('.sora-sr-only', status).textContent).toBe('Loading content')
    expect(all('.sora-skeleton__block', status)).toHaveLength(1)
  })
})

describe('SoraToastProvider', () => {
  it('keeps a labelled region with persistent polite and assertive live regions in the top layer', async () => {
    const { region } = setup()
    await flush()
    expect(region().getAttribute('aria-label')).toBe('Messages')
    expect(region().matches(':popover-open')).toBe(true)
    const [polite, assertive] = all('.sora-toast-region__list', region())
    expect([polite?.getAttribute('role'), polite?.getAttribute('aria-live')]).toEqual(['status', 'polite'])
    expect([assertive?.getAttribute('role'), assertive?.getAttribute('aria-live')]).toEqual([
      'alert',
      'assertive',
    ])
    // Both live regions are rendered while empty: a region must be in the
    // accessibility tree before a message is inserted for it to be announced.
    for (const list of [polite, assertive]) {
      expect(list?.children).toHaveLength(0)
      expect(getComputedStyle(list as Element).display).not.toBe('none')
      // The status and alert roles are not allowed on list elements.
      expect(list?.tagName).toBe('DIV')
    }
    // Attributes passed to the provider land on the region, next to the unwrapped slot content.
    expect(region().dataset['testid']).toBe('toast-region')
    expect(region().classList.contains('from-caller')).toBe(true)
    expect(q('toast-add').parentElement).toBe(region().parentElement)
  })

  it('leaves the region in place when nothing covers it, and re-enters the top layer when a dialog does', async () => {
    const { region } = setup()
    await flush()
    const toggles: string[] = []
    region().addEventListener('toggle', (event) => toggles.push((event as ToggleEvent).newState))
    await userEvent.click(q('toast-add'))
    await flush()
    // Nothing else is in the top layer: the live regions were not disturbed.
    expect(toggles).toEqual([])

    const dialog = document.createElement('dialog')
    dialog.dataset['testRoot'] = ''
    document.body.append(dialog)
    dialog.showModal()
    q<HTMLButtonElement>('toast-add').click()
    await flush()
    // A modal dialog opened later would cover the region, so it is promoted above it
    // (hide + show in one task is reported as a single, coalesced toggle event).
    expect(toggles).toEqual(['open'])
    expect(region().matches(':popover-open')).toBe(true)
    dialog.close()
  })

  it('adds ordinary toasts politely and urgent ones assertively', async () => {
    const { region, toasts } = setup()
    await userEvent.click(q('toast-add'))
    await userEvent.click(q('toast-urgent'))
    await flush()
    expect(toasts()).toEqual(['Toast 1', 'Urgent'])
    const [polite, assertive] = all('.sora-toast-region__list', region())
    expect(polite?.textContent).toContain('Toast 1')
    expect(polite?.textContent).toContain('Details')
    expect(assertive?.textContent).toContain('Urgent')
    expect($('.sora-toast[data-urgent]').dataset['color']).toBe('error')
  })

  it('dismisses with a named button and reports the queue length', async () => {
    const { toasts } = setup()
    await userEvent.click(q('toast-add'))
    await flush()
    expect(q('toast-count').textContent).toBe('1')
    const dismiss = $<HTMLButtonElement>('.sora-toast button[aria-label="Dismiss notification"]')
    await userEvent.click(dismiss)
    await flush()
    expect(toasts()).toEqual([])
    expect(q('toast-count').textContent).toBe('0')
  })

  it('dismisses automatically after its duration, but keeps persistent toasts', async () => {
    const { toasts } = setup({ duration: 150 })
    await userEvent.click(q('toast-add'))
    await userEvent.click(q('toast-sticky'))
    await flush()
    expect(toasts()).toEqual(['Toast 1', 'Sticky'])
    await until(() => toasts().length === 1)
    await wait(250)
    expect(toasts()).toEqual(['Sticky'])
  })

  it('pauses auto-dismissal while the pointer or focus is inside the region', async () => {
    const { toasts, region } = setup({ duration: 200 })
    await userEvent.click(q('toast-add'))
    await flush()
    region().dispatchEvent(new PointerEvent('pointerenter'))
    await wait(450)
    expect(toasts()).toEqual(['Toast 1'])
    region().dispatchEvent(new PointerEvent('pointerleave'))
    await until(() => toasts().length === 0)

    // Keyboard focus pauses it too.
    await userEvent.click(q('toast-add'))
    await flush()
    $<HTMLButtonElement>('.sora-toast button').focus()
    await wait(450)
    expect(toasts()).toEqual(['Toast 2'])
    ;(document.activeElement as HTMLElement).blur()
    await until(() => toasts().length === 0)
  })

  it('shows at most `max` toasts and brings queued ones in as others leave', async () => {
    const { toasts } = setup({ max: 2 })
    for (let index = 0; index < 4; index++) await userEvent.click(q('toast-add'))
    await flush()
    expect(q('toast-count').textContent).toBe('4')
    expect(toasts()).toEqual(['Toast 1', 'Toast 2'])
    await userEvent.click($<HTMLButtonElement>('.sora-toast button[aria-label="Dismiss notification"]'))
    await flush()
    expect(toasts()).toEqual(['Toast 2', 'Toast 3'])
  })

  it('replaces a toast that is added again with the same id', async () => {
    const { toasts } = setup()
    await userEvent.click(q('toast-same'))
    await userEvent.click(q('toast-same'))
    await flush()
    expect(toasts()).toEqual(['Same 2'])
  })

  it('runs a toast action once and then dismisses the toast; clear() empties the queue', async () => {
    const { state, toasts } = setup()
    await userEvent.click(q('toast-action'))
    await flush()
    await userEvent.click($<HTMLButtonElement>('.sora-toast__action'))
    await flush()
    expect(state.actions).toEqual(['undo'])
    expect(toasts()).toEqual([])

    await userEvent.click(q('toast-add'))
    await userEvent.click(q('toast-sticky'))
    await userEvent.click(q('toast-clear'))
    await flush()
    expect(toasts()).toEqual([])
  })

  it('closes its popover and stops its timers when unmounted', async () => {
    const { state } = setup({ duration: 100 })
    await userEvent.click(q('toast-add'))
    await flush()
    state.showProvider = false
    await flush()
    expect(document.querySelector('.sora-toast-region')).toBeNull()
    // The pending auto-dismiss timer must not fire into a dead component.
    await wait(200)
  })

  it('useToast() outside a provider fails with a clear message', () => {
    let message = ''
    mountVapor(ToastOrphan, { props: { report: () => (text: string) => (message = text) } })
    expect(message).toMatch(/SoraToastProvider/)
  })
})
