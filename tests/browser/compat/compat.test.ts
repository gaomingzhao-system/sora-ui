/**
 * Compatibility milestone (spec §3): proves the pinned toolchain renders
 * project-owned Vapor SFCs with every feature the library relies on.
 */
import { createI18n } from 'petite-vue-i18n'
import { createVaporApp, defineVaporComponent, markRaw, nextTick, reactive, version } from 'vue'
import { describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import CompatApp, { type CompatState } from '../../fixtures/compat/CompatApp.vue'
import { mountVapor, settle } from '../../helpers/mount-vapor.ts'

const q = <T extends HTMLElement = HTMLElement>(testId: string): T => {
  const element = document.querySelector<T>(`[data-testid="${testId}"]`)
  if (!element) throw new Error(`missing [data-testid="${testId}"]`)
  return element
}

const setup = (overrides: Partial<CompatState> = {}) => {
  const i18n = createI18n({
    legacy: false,
    locale: 'en',
    fallbackLocale: 'en',
    messages: {
      en: { 'actions.save': 'Save', 'dialog.close': 'Close' },
      ja: { 'actions.save': '保存', 'dialog.close': '閉じる' },
    },
  })
  const saved: { email: string }[] = []
  let release: (() => void) | undefined
  const state = reactive<CompatState>({
    label: 'Total',
    size: undefined,
    count: 2,
    items: ['a', 'b'],
    text: 'hello',
    open: false,
    showLifecycle: true,
    tick: 0,
    log: [],
    commits: [],
    keydowns: 0,
    dialogOpen: false,
    save: (output) =>
      new Promise<void>((resolve) => {
        saved.push(output)
        release = resolve
      }),
    // markRaw: a deep reactive proxy would unwrap the composer's refs.
    i18n: markRaw(i18n) as unknown as CompatState['i18n'],
    ...overrides,
  }) as unknown as CompatState
  const view = mountVapor(CompatApp, { props: { state } })
  return { state, view, i18n, saved, release: () => release?.() }
}

describe('toolchain', () => {
  it('runs the exact Vue RC with the Vapor runtime from the browser bundler entry', () => {
    expect(version).toBe('3.6.0-rc.15')
    expect(typeof createVaporApp).toBe('function')
    expect(typeof defineVaporComponent).toBe('function')
  })

  it('compiles the fixture as a Vapor component (no VDOM render function)', () => {
    const component = CompatApp as unknown as { __vapor?: boolean; render?: unknown; setup?: unknown }
    expect(component.__vapor).toBe(true)
    // In dev the template is a separate *Vapor* render function; it must not
    // contain any VDOM block/vnode helper.
    const code = `${String(component.setup)}\n${String(component.render ?? '')}`
    expect(code).not.toMatch(/createElementVNode|createVNode|createElementBlock|openBlock|createBlock\b/)
    expect(code).toMatch(/createComponent|_createComponent/)
  })
})

describe('1. reactive props and destructured defaults', () => {
  it('applies the destructured default and reacts to prop changes', async () => {
    const { state } = setup()
    expect(q('props').textContent).toBe('Total:4')
    expect(q('props').dataset['size']).toBe('md')

    state.label = 'Sum'
    state.count = 5
    state.size = 'lg'
    await nextTick()
    expect(q('props').textContent).toBe('Sum:10')
    expect(q('props').dataset['size']).toBe('lg')
  })
})

describe('2. default, named and scoped slots', () => {
  it('renders all slot kinds and keeps them reactive', async () => {
    const { state } = setup()
    expect(q('slot-header').textContent).toBe('header Total')
    expect(q('slot-default').textContent?.trim()).toBe('default 2')
    const items = () =>
      [...document.querySelectorAll('[data-testid="slot-item"]')].map((li) => li.textContent)
    expect(items()).toEqual(['0-A', '1-B'])

    state.items.push('c')
    state.count = 9
    await nextTick()
    expect(items()).toEqual(['0-A', '1-B', '2-C'])
    expect(q('slot-default').textContent?.trim()).toBe('default 9')
  })
})

describe('3. typed defineModel', () => {
  it('propagates user input to the parent and parent changes to the child', async () => {
    const { state } = setup()
    const input = q<HTMLInputElement>('model-input')
    expect(input.value).toBe('hello')

    await userEvent.fill(input, 'from user')
    expect(state.text).toBe('from user')
    expect(q('model-echo').textContent).toBe('from user|false')

    state.text = 'from parent'
    await nextTick()
    expect(input.value).toBe('from parent')

    await userEvent.click(q('model-toggle'))
    expect(state.open).toBe(true)
    state.open = false
    await nextTick()
    expect(q('model-root').dataset['open']).toBe('false')
  })
})

describe('4. useTemplateRef + defineExpose', () => {
  it('exposes a focus() that reaches the real native element', async () => {
    setup()
    await userEvent.click(q('focus-model'))
    expect(document.activeElement).toBe(q('model-input'))
  })
})

describe('5. native attributes, events, conditional rendering, cleanup', () => {
  it('forwards attributes and listeners to the native control only', async () => {
    const { state } = setup()
    const input = q<HTMLInputElement>('model-input')
    const root = q('model-root')
    expect(input.name).toBe('nickname')
    expect(input.getAttribute('autocomplete')).toBe('nickname')
    expect(input.getAttribute('aria-describedby')).toBe('hint-a')
    expect(input.classList.contains('from-parent')).toBe(true)
    expect(root.hasAttribute('name')).toBe(false)
    expect(root.classList.contains('from-parent')).toBe(false)

    input.focus()
    await userEvent.keyboard('x{Enter}')
    expect(state.keydowns).toBe(2)
    expect(state.commits).toEqual(['hellox'])
  })

  it('runs watchers, cleanups and unmount hooks', async () => {
    const { state } = setup()
    expect(state.log).toEqual(['mounted'])
    state.tick = 1
    await nextTick()
    state.tick = 2
    await nextTick()
    expect(state.log).toEqual(['mounted', 'tick:1', 'cleanup:1', 'tick:2'])

    state.showLifecycle = false
    await nextTick()
    expect(document.querySelector('[data-testid="lifecycle"]')).toBeNull()
    expect(state.log).toContain('beforeUnmount')
    expect(state.log).toContain('scopeDispose')
    expect(state.log).toContain('cleanup:2')

    state.showLifecycle = true
    await nextTick()
    expect(q('lifecycle').textContent).toBe('alive 2')
  })
})

describe('6. Formisch in a Vapor component', () => {
  it('validates on blur, on submit, and awaits the async submission', async () => {
    const { saved, release } = setup()
    const email = q<HTMLInputElement>('form-email')
    const formState = () => q('form-state').textContent
    expect(formState()).toBe('idle|untouched|pristine')
    expect(document.querySelector('[data-testid="form-error"]')).toBeNull()

    // submit validation
    await userEvent.click(q('form-submit'))
    await settle()
    expect(q('form-error').textContent).toBe('required')
    expect(saved).toEqual([])

    // blur validation + revalidation on input
    await userEvent.fill(email, 'nope')
    email.blur()
    await settle()
    expect(q('form-error').textContent).toBe('invalid')
    expect(email.getAttribute('aria-invalid')).toBe('true')
    await userEvent.fill(email, 'ada@example.com')
    await settle()
    expect(document.querySelector('[data-testid="form-error"]')).toBeNull()
    expect(formState()).toBe('idle|touched|dirty')

    // async submission keeps isSubmitting true until the handler resolves
    await userEvent.click(q('form-submit'))
    await settle()
    expect(saved).toEqual([{ email: 'ada@example.com' }])
    expect(formState()).toContain('submitting')
    expect(q<HTMLButtonElement>('form-submit').disabled).toBe(true)
    release()
    await settle()
    expect(formState()).toContain('idle')
  })
})

describe('7. petite-vue-i18n locale switching', () => {
  it('updates rendered text and attributes when the locale changes', async () => {
    const { i18n } = setup()
    expect(q('i18n-label').textContent).toBe('Save')
    expect(q('i18n-label').getAttribute('aria-label')).toBe('Close')

    i18n.global.locale.value = 'ja'
    await nextTick()
    expect(q('i18n-label').textContent).toBe('保存')
    expect(q('i18n-label').getAttribute('aria-label')).toBe('閉じる')
    expect(q('i18n-locale').textContent).toBe('ja')
  })
})

describe('8. native dialog and popover', () => {
  it('opens a modal dialog, closes on Escape, syncs the model and restores focus', async () => {
    const { state } = setup()
    const trigger = q('dialog-trigger')
    const dialog = q<HTMLDialogElement>('dialog')

    trigger.focus()
    await userEvent.click(trigger)
    await settle()
    expect(dialog.open).toBe(true)
    expect(dialog.matches(':modal')).toBe(true)
    expect(dialog.contains(document.activeElement)).toBe(true)

    await userEvent.keyboard('{Escape}')
    await settle()
    expect(dialog.open).toBe(false)
    expect(state.dialogOpen).toBe(false)
    expect(document.activeElement).toBe(trigger)

    state.dialogOpen = true
    await settle()
    expect(dialog.open).toBe(true)
    await userEvent.click(q('dialog-close'))
    await settle()
    expect(dialog.open).toBe(false)
  })

  it('opens a popover declaratively, light-dismisses on Escape and restores focus', async () => {
    setup()
    const trigger = q('popover-trigger')
    const popover = q('popover')

    trigger.focus()
    await userEvent.click(trigger)
    await settle()
    expect(popover.matches(':popover-open')).toBe(true)

    q('popover-inner').focus()
    await userEvent.keyboard('{Escape}')
    await settle()
    expect(popover.matches(':popover-open')).toBe(false)
    expect(document.activeElement).toBe(trigger)
  })
})
