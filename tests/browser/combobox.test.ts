import { nextTick, reactive } from 'vue'
import { describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { mountVapor } from '../helpers/mount-vapor.ts'
import ComboboxHarness from './harness/ComboboxHarness.vue'
import type { ComboboxState } from './harness/ComboboxHarness.vue'
import { $, all, description, flush, press, q, until } from './support.ts'

function setup(overrides: Partial<ComboboxState> = {}) {
  const state = reactive<ComboboxState>({
    value: null,
    asyncValue: null,
    selected: [],
    submits: 0,
    pending: [],
    disabled: false,
    ...overrides,
  })
  const view = mountVapor(ComboboxHarness, { props: { state } })
  const input = q<HTMLInputElement>('combobox')
  const field = input.closest<HTMLElement>('.sora-field') as HTMLElement
  const popup = $('.sora-combobox__popup', field)
  const listbox = $('[role="listbox"]', field)
  const options = (): HTMLElement[] => all('[role="option"]', listbox)
  const labels = (): string[] =>
    options().map((option) => $('.sora-listbox__text > span', option).textContent ?? '')
  const active = (): string | undefined => {
    const id = input.getAttribute('aria-activedescendant')
    return id
      ? (document.getElementById(id)?.querySelector('.sora-listbox__text > span')?.textContent ?? undefined)
      : undefined
  }
  const isOpen = (): boolean => popup.matches(':popover-open')
  const status = (): string => $('[role="status"]', field).textContent ?? ''
  return { state, view, input, field, popup, listbox, options, labels, active, isOpen, status }
}

describe('SoraCombobox: semantics', () => {
  it('follows the ARIA combobox pattern with a labelled listbox popup', async () => {
    const { input, listbox, popup, isOpen, options } = setup()
    expect(input.getAttribute('role')).toBe('combobox')
    expect(input.getAttribute('aria-autocomplete')).toBe('list')
    expect(input.getAttribute('aria-expanded')).toBe('false')
    expect(input.getAttribute('aria-controls')).toBe(listbox.id)
    expect(input.hasAttribute('aria-activedescendant')).toBe(false)
    expect(input.getAttribute('autocomplete')).toBe('off')
    expect(input.name).toBe('fruit')
    expect(input.labels?.[0]?.textContent).toContain('Fruit')
    expect(description(input)).toBe('Pick one')
    expect(document.getElementById(listbox.getAttribute('aria-labelledby') ?? '')?.textContent).toContain(
      'Fruit',
    )
    // A manual popover: in the top layer, without taking focus from the input.
    expect(popup.getAttribute('popover')).toBe('manual')
    expect(isOpen()).toBe(false)

    input.focus()
    await press('{ArrowDown}')
    expect(isOpen()).toBe(true)
    expect(input.getAttribute('aria-expanded')).toBe('true')
    expect(document.activeElement).toBe(input)
    expect(options().map((option) => option.getAttribute('aria-selected'))).toEqual([
      'false',
      'false',
      'false',
      'false',
      'false',
    ])
    expect(options()[2]?.getAttribute('aria-disabled')).toBe('true')
  })

  it('anchors the popup under the field at the field width', async () => {
    const { input, popup } = setup()
    input.focus()
    await press('{ArrowDown}')
    await flush()
    const wrapper = (input.closest('.sora-input') as HTMLElement).getBoundingClientRect()
    const box = popup.getBoundingClientRect()
    expect(box.top).toBeGreaterThanOrEqual(wrapper.bottom)
    expect(box.top - wrapper.bottom).toBeLessThan(12)
    expect(Math.abs(box.left - wrapper.left)).toBeLessThan(2)
    expect(Math.abs(box.width - wrapper.width)).toBeLessThan(2)
  })
})

describe('SoraCombobox: keyboard', () => {
  it('moves the active option with the arrows, skipping disabled options and wrapping', async () => {
    const { input, active } = setup()
    input.focus()
    await press('{ArrowDown}')
    expect(active()).toBe('Apple')
    await press('{ArrowDown}')
    expect(active()).toBe('Apricot')
    await press('{ArrowDown}')
    expect(active()).toBe('Cherry')
    await press('{ArrowDown}{ArrowDown}')
    expect(active()).toBe('Apple')
    await press('{ArrowUp}')
    expect(active()).toBe('Crème brûlée')
  })

  it('ArrowUp opens on the last option; Alt+ArrowDown opens without an active option; Alt+ArrowUp closes', async () => {
    const { input, active, isOpen } = setup()
    input.focus()
    await press('{ArrowUp}')
    expect(active()).toBe('Crème brûlée')
    await press('{Alt>}{ArrowUp}{/Alt}')
    expect(isOpen()).toBe(false)
    await press('{Alt>}{ArrowDown}{/Alt}')
    expect(isOpen()).toBe(true)
    expect(active()).toBeUndefined()
  })

  it('Enter selects the active option, closes the popup and does not submit the form', async () => {
    const { state, input, isOpen, options } = setup()
    input.focus()
    await press('{ArrowDown}{ArrowDown}{Enter}')
    expect(state.value).toBe('apricot')
    expect(state.selected).toEqual(['apricot'])
    expect(input.value).toBe('Apricot')
    expect(isOpen()).toBe(false)
    expect(state.submits).toBe(0)
    expect(document.activeElement).toBe(input)

    // Reopening starts on the selected option, which is marked selected.
    await press('{ArrowDown}')
    expect(options()[1]?.getAttribute('aria-selected')).toBe('true')
    expect(options()[1]?.hasAttribute('data-active')).toBe(true)
    await press('{Escape}')
    // With the popup closed, Enter is an ordinary form submission again.
    await press('{Enter}')
    expect(state.submits).toBe(1)
  })

  it('Escape closes the popup first and clears the selection second', async () => {
    const { state, input, isOpen } = setup({ value: 'cherry' })
    await nextTick()
    expect(input.value).toBe('Cherry')
    input.focus()
    await press('{ArrowDown}')
    await press('{Escape}')
    expect(isOpen()).toBe(false)
    expect(state.value).toBe('cherry')
    await press('{Escape}')
    expect(state.value).toBeNull()
    expect(state.selected).toEqual([null])
    expect(input.value).toBe('')
  })

  it('Tab closes the popup without selecting and restores the text', async () => {
    const { state, input, isOpen } = setup({ value: 'apple' })
    input.focus()
    await press('{ArrowDown}{ArrowDown}')
    await userEvent.fill(input, 'che')
    await press('{Tab}')
    expect(isOpen()).toBe(false)
    expect(state.value).toBe('apple')
    // Free text is never a value: the selected label comes back.
    expect(input.value).toBe('Apple')
    expect(document.activeElement).not.toBe(input)
  })
})

describe('SoraCombobox: filtering and pointer', () => {
  it('filters as the user types, ignoring case and accents, and highlights the first match', async () => {
    const { input, labels, active, isOpen, status } = setup()
    await userEvent.fill(input, 'ap')
    expect(isOpen()).toBe(true)
    expect(labels()).toEqual(['Apple', 'Apricot'])
    expect(active()).toBe('Apple')
    expect(status()).toBe('Results available: 2')

    await userEvent.fill(input, 'BRULEE')
    expect(labels()).toEqual(['Crème brûlée'])
    await userEvent.fill(input, 'zzz')
    expect(labels()).toEqual([])
    expect($('.sora-combobox__status').textContent?.trim()).toBe('No results')
    expect(status()).toBe('No results')
    expect(active()).toBeUndefined()
  })

  it('selects with the pointer without moving focus out of the input, and ignores disabled options', async () => {
    const { state, input, options, isOpen } = setup()
    input.focus()
    await press('{ArrowDown}')
    await userEvent.click(options()[2] as HTMLElement, { force: true })
    expect(state.value).toBeNull()
    expect(isOpen()).toBe(true)
    await userEvent.click(options()[3] as HTMLElement)
    expect(state.value).toBe('cherry')
    expect(isOpen()).toBe(false)
    expect(document.activeElement).toBe(input)
  })

  it('has pointer-only clear and toggle buttons with translated names', async () => {
    const { state, input, field, isOpen } = setup({ value: 'cherry' })
    await nextTick()
    const clear = $<HTMLButtonElement>('button[aria-label="Clear selection"]', field)
    const toggle = $<HTMLButtonElement>('button[aria-label="Show options"]', field)
    expect([clear.tabIndex, toggle.tabIndex]).toEqual([-1, -1])
    await userEvent.click(toggle)
    expect(isOpen()).toBe(true)
    expect(document.activeElement).toBe(input)
    await userEvent.click(toggle)
    expect(isOpen()).toBe(false)
    await userEvent.click(clear)
    expect(state.value).toBeNull()
    expect(input.value).toBe('')
    expect(field.querySelector('button[aria-label="Clear selection"]')).toBeNull()
  })

  it('follows the parent value and does nothing while disabled', async () => {
    const { state, input, isOpen } = setup()
    state.value = 'apricot'
    await nextTick()
    expect(input.value).toBe('Apricot')
    state.disabled = true
    await nextTick()
    expect(input.disabled).toBe(true)
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
    await flush()
    expect(isOpen()).toBe(false)
  })
})

describe('SoraCombobox: asynchronous source', () => {
  function asyncSetup() {
    const context = setup()
    const input = q<HTMLInputElement>('combobox-async')
    const field = input.closest<HTMLElement>('.sora-field') as HTMLElement
    const labels = (): string[] =>
      all('[role="option"] .sora-listbox__text > span', field).map((node) => node.textContent ?? '')
    const status = (): string => $('[role="status"]', field).textContent ?? ''
    return { ...context, input, field, labels, status }
  }

  it('shows a loading state, then the results, and announces both', async () => {
    const { state, input, field, labels, status } = asyncSetup()
    input.focus()
    await press('{ArrowDown}')
    await until(() => state.pending.length === 1)
    expect(state.pending[0]?.query).toBe('')
    expect(status()).toBe('Loading options')
    expect($('.sora-combobox__status', field).textContent?.trim()).toBe('Loading options')
    expect(field.querySelector('.sora-spinner')).not.toBeNull()

    state.pending[0]?.resolve([
      { value: 'kiwi', label: 'Kiwi' },
      { value: 'lime', label: 'Lime' },
    ])
    await until(() => labels().length === 2)
    expect(labels()).toEqual(['Kiwi', 'Lime'])
    expect(status()).toBe('Results available: 2')
    expect(field.querySelector('.sora-spinner')).toBeNull()

    await press('{ArrowDown}{Enter}')
    expect(state.asyncValue).toBe('lime')
    expect(input.value).toBe('Lime')
  })

  it('aborts superseded requests and discards results that arrive out of order', async () => {
    const { state, input, labels } = asyncSetup()
    await userEvent.fill(input, 'a')
    await until(() => state.pending.length === 1)
    await userEvent.fill(input, 'ab')
    await until(() => state.pending.length === 2)
    const [first, second] = state.pending
    // The first request was told it is no longer needed.
    expect(first?.signal.aborted).toBe(true)
    expect(second?.signal.aborted).toBe(false)

    // The newer response arrives first; the stale one must not overwrite it.
    second?.resolve([{ value: 'ab', label: 'Result for ab' }])
    await until(() => labels().length === 1)
    first?.resolve([{ value: 'a', label: 'Stale result for a' }])
    await flush()
    await flush()
    expect(labels()).toEqual(['Result for ab'])
  })

  it('reports a failed request and recovers on the next search', async () => {
    const { state, input, field, labels, status } = asyncSetup()
    await userEvent.fill(input, 'x')
    await until(() => state.pending.length === 1)
    state.pending[0]?.reject(new Error('offline'))
    await until(() => status() === 'Options could not be loaded.')
    expect($('.sora-combobox__status', field).dataset['tone']).toBe('error')

    await userEvent.fill(input, 'xy')
    await until(() => state.pending.length === 2)
    state.pending[1]?.resolve([{ value: 'xy', label: 'Recovered' }])
    await until(() => labels().length === 1)
    expect(status()).toBe('Results available: 1')
  })

  it('cancels its pending request when the popup closes and when it unmounts', async () => {
    const { state, input, view } = asyncSetup()
    await userEvent.fill(input, 'a')
    await until(() => state.pending.length === 1)
    await press('{Escape}')
    expect(state.pending[0]?.signal.aborted).toBe(true)

    await userEvent.fill(input, 'b')
    await until(() => state.pending.length === 2)
    view.unmount()
    expect(state.pending[1]?.signal.aborted).toBe(true)
  })
})
