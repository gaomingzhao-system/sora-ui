import { nextTick, reactive } from 'vue'
import { describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { mountVapor } from '../helpers/mount-vapor.ts'
import ActionsHarness from './harness/ActionsHarness.vue'
import type { ActionsState } from './harness/ActionsHarness.vue'
import { flush, press, q } from './support.ts'

function setup(overrides: Partial<ActionsState> = {}) {
  const state = reactive<ActionsState>({
    loading: false,
    disabled: false,
    clicks: 0,
    submits: 0,
    variant: undefined,
    linkDisabled: false,
    // Built in script: see docs/compatibility.md (vue-tsc and `//` in static attributes).
    href: 'https://example.com/docs',
    ...overrides,
  })
  const view = mountVapor(ActionsHarness, { props: { state } })
  return { state, view }
}

describe('UiButton', () => {
  it('is a native button that defaults to type="button" and never submits by accident', async () => {
    const { state } = setup()
    const button = q<HTMLButtonElement>('button')
    expect(button.tagName).toBe('BUTTON')
    expect(button.type).toBe('button')
    await userEvent.click(button)
    expect(state.clicks).toBe(1)
    expect(state.submits).toBe(0)

    await userEvent.click(q('submit'))
    expect(state.submits).toBe(1)
  })

  it('resolves variant, colour and size from props, then the provider, then ui.config.ts', async () => {
    const { state } = setup()
    const button = q('button')
    expect(button.dataset['variant']).toBe('solid')
    expect(button.dataset['color']).toBe('primary')
    expect(button.dataset['size']).toBe('md')

    state.variant = 'outline'
    await nextTick()
    expect(button.dataset['variant']).toBe('outline')

    const provided = q('provided')
    expect([provided.dataset['variant'], provided.dataset['color'], provided.dataset['size']]).toEqual([
      'soft',
      'secondary',
      'lg',
    ])
  })

  it('forwards attributes and listeners to the native button', () => {
    setup()
    const button = q<HTMLButtonElement>('button')
    expect(button.name).toBe('action')
    expect(button.getAttribute('aria-describedby')).toBe('help')
    expect(button.classList.contains('vui-button')).toBe(true)
    expect(button.classList.contains('from-caller')).toBe(true)
    expect(q('trailing').closest('button')).toBe(button)
  })

  it('disabled uses the native attribute: not focusable, not clickable', async () => {
    const { state } = setup({ disabled: true })
    const button = q<HTMLButtonElement>('button')
    expect(button.disabled).toBe(true)
    button.focus()
    expect(document.activeElement).not.toBe(button)
    button.click()
    expect(state.clicks).toBe(0)
  })

  it('loading keeps the label, the width and focus, and ignores activation', async () => {
    const { state, view } = setup()
    const button = q<HTMLButtonElement>('button')
    const width = button.getBoundingClientRect().width
    ;(view.app._instance?.exposed as { focusButton(): void } | undefined)?.focusButton()
    button.focus()
    expect(document.activeElement).toBe(button)

    state.loading = true
    await flush()
    // Still focused and still focusable: aria-disabled, not the disabled attribute.
    expect(document.activeElement).toBe(button)
    expect(button.disabled).toBe(false)
    expect(button.getAttribute('aria-disabled')).toBe('true')
    expect(button.getAttribute('aria-busy')).toBe('true')
    // The label stays in the accessibility tree (opacity, not display/visibility).
    expect(button.textContent).toContain('Save changes')
    const label = button.querySelector<HTMLElement>('.vui-button__label')
    expect(label && getComputedStyle(label).visibility).toBe('visible')
    expect(label && getComputedStyle(label).display).not.toBe('none')
    expect(button.querySelector('.vui-button__spinner')?.getAttribute('aria-hidden')).toBe('true')
    // Same width as before.
    expect(button.getBoundingClientRect().width).toBeCloseTo(width, 0)

    // Pointer, Enter and Space are all ignored, and so is a caller's listener.
    // (`force`: Playwright itself refuses to click an aria-disabled element; a person still can.)
    await userEvent.click(button, { force: true })
    await press('{Enter}')
    await press(' ')
    expect(state.clicks).toBe(0)

    state.loading = false
    await flush()
    expect(button.hasAttribute('aria-busy')).toBe(false)
    await press('{Enter}')
    expect(state.clicks).toBe(1)
  })

  it('a loading submit button does not submit the form (pointer or keyboard)', async () => {
    const { state } = setup({ loading: true })
    const submit = q<HTMLButtonElement>('submit')
    await userEvent.click(submit, { force: true })
    submit.focus()
    await press('{Enter}')
    expect(state.submits).toBe(0)
  })

  it('exposes focus() and the native element', () => {
    const { view } = setup()
    const exposed = view.app._instance?.exposed as {
      focusButton(): void
      buttonElement(): HTMLElement | null | undefined
    }
    exposed.focusButton()
    expect(document.activeElement).toBe(q('button'))
    expect(exposed.buttonElement()).toBe(q('button'))
  })
})

describe('UiIconButton', () => {
  it('requires a label, which becomes the accessible name; the icon is decorative', async () => {
    const { state } = setup()
    const button = q<HTMLButtonElement>('icon-button')
    expect(button.getAttribute('aria-label')).toBe('Add item')
    expect(button.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true')
    expect(button.textContent?.trim()).toBe('')
    await userEvent.click(button)
    expect(state.clicks).toBe(1)
    // Square, and ghost/neutral by default.
    const box = button.getBoundingClientRect()
    expect(box.width).toBeCloseTo(box.height, 0)
    expect([button.dataset['variant'], button.dataset['color']]).toEqual(['ghost', 'neutral'])
  })
})

describe('UiButtonGroup', () => {
  it('is a labelled group that gives its buttons shared defaults', () => {
    setup()
    const group = q('group')
    expect(group.getAttribute('role')).toBe('group')
    expect(group.getAttribute('aria-label')).toBe('View')
    // `aria-orientation` is not allowed on role="group"; the layout hook is a data attribute.
    expect(group.hasAttribute('aria-orientation')).toBe(false)
    expect(group.dataset['orientation']).toBe('horizontal')
    expect(group.hasAttribute('data-attached')).toBe(true)
    expect([
      q('group-a').dataset['variant'],
      q('group-a').dataset['size'],
      q('group-a').dataset['color'],
    ]).toEqual(['outline', 'sm', 'neutral'])
    // An explicit prop still wins over the group's default.
    expect(q('group-b').dataset['variant']).toBe('solid')
    expect(q('group-icon').dataset['size']).toBe('sm')
    // Attached buttons share edges: the middle one has no radius.
    expect(getComputedStyle(q('group-b')).borderStartStartRadius).toBe('0px')
  })
})

describe('UiLink', () => {
  it('renders a real anchor', () => {
    setup()
    const link = q<HTMLAnchorElement>('link')
    expect(link.tagName).toBe('A')
    expect(link.href).toBe('https://example.com/docs')
    expect(link.hasAttribute('target')).toBe(false)
    // Underlined by default: identifiable without relying on colour.
    expect(getComputedStyle(link).textDecorationLine).toBe('underline')
  })

  it('marks external links for assistive technology and protects the opener', () => {
    setup()
    const link = q<HTMLAnchorElement>('external')
    expect(link.target).toBe('_blank')
    expect(link.rel).toBe('noopener noreferrer')
    expect(link.textContent).toContain('(opens in a new tab)')
    expect(link.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true')
  })

  it('a disabled link has no href and says so', async () => {
    const { state } = setup()
    const link = q<HTMLAnchorElement>('link')
    state.linkDisabled = true
    await nextTick()
    expect(link.hasAttribute('href')).toBe(false)
    expect(link.getAttribute('role')).toBe('link')
    expect(link.getAttribute('aria-disabled')).toBe('true')
  })
})
