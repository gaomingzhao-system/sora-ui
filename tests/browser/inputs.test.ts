import { nextTick, reactive } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { mountVapor } from '../helpers/mount-vapor.ts'
import InputsHarness from './harness/InputsHarness.vue'
import type { InputsState } from './harness/InputsHarness.vue'
import { $, all, description, flush, press, q, wait } from './support.ts'

interface Exposed {
  input(): { focus(): void; select(): void; element: HTMLInputElement | null } | null
  number(): { focus(): void; element: HTMLInputElement | null } | null
  radios(): { focus(): void } | null
  files(): { clear(): void; focus(): void; element: HTMLInputElement | null } | null
}

function setup(overrides: Partial<InputsState> = {}) {
  const state = reactive<InputsState>({
    text: 'Ada',
    error: null,
    hint: 'As shown on your profile',
    disabled: false,
    describedBy: undefined,
    controlAttrs: undefined,
    events: [],
    showInput: true,
    textarea: '',
    password: 'secret',
    revealed: false,
    amount: 3,
    date: '2026-11-15',
    checked: false,
    mixed: false,
    selected: ['ts'],
    plan: null,
    on: false,
    country: null,
    volume: 20,
    files: [],
    previews: false,
    showFiles: true,
    resets: 0,
    ...overrides,
  })
  const view = mountVapor(InputsHarness, { props: { state } })
  const exposed = view.app._instance?.exposed as Exposed
  /** The native control inside a component root located by test id. */
  const control = <T extends HTMLElement = HTMLInputElement>(
    testId: string,
    selector = 'input, textarea, select',
  ): T => $<T>(selector, q(testId).closest('.vui-field, .vui-check, .vui-switch') ?? document)
  return { state, view, exposed, control }
}

// `data-testid` falls through to the native control, so q() returns the control itself.
const root = (control: Element): HTMLElement => {
  const element = control.closest<HTMLElement>('.vui-field, .vui-check, .vui-switch')
  if (!element) throw new Error('no component root')
  return element
}

describe('UiField', () => {
  it('wires a label, hint and error to any control through slot props', async () => {
    const { state } = setup({ error: 'Too short' })
    const field = q('field')
    const controlEl = q<HTMLInputElement>('field-control')
    const label = $<HTMLLabelElement>('label', field)
    expect(label.htmlFor).toBe(controlEl.id)
    expect(controlEl.labels?.[0]).toBe(label)
    expect(description(controlEl)).toBe('Field hint | Too short')
    expect(controlEl.getAttribute('aria-invalid')).toBe('true')
    expect(field.hasAttribute('data-invalid')).toBe(true)
    // The asterisk is decoration; the control is what carries `required`.
    expect($('.vui-field__required', label).getAttribute('aria-hidden')).toBe('true')
    // Errors pair the colour with an icon and text.
    expect($('.vui-field__error svg', field)).not.toBeNull()

    state.error = ['First problem', 'Second problem']
    await nextTick()
    expect(all('.vui-field__message', field).map((line) => line.textContent?.trim())).toEqual([
      'First problem',
      'Second problem',
    ])

    state.error = null
    await nextTick()
    expect(description(controlEl)).toBe('Field hint')
    expect(controlEl.hasAttribute('aria-invalid')).toBe(false)
    expect(field.querySelector('.vui-field__error')).toBeNull()
  })

  it('renders fieldset/legend for groups and disables the group natively', () => {
    setup()
    const fieldset = q<HTMLFieldSetElement>('fieldset')
    expect(fieldset.tagName).toBe('FIELDSET')
    expect($('legend', fieldset).textContent?.trim()).toBe('Group')
    expect(description(fieldset)).toBe('Group hint')
    expect(fieldset.disabled).toBe(true)
    expect(q<HTMLInputElement>('fieldset-control').matches(':disabled')).toBe(true)
  })
})

describe('UiInput', () => {
  it('binds v-model in both directions on a labelled native input', async () => {
    const { state } = setup()
    const input = q<HTMLInputElement>('input')
    expect(input.tagName).toBe('INPUT')
    expect(input.type).toBe('text')
    expect(input.value).toBe('Ada')
    expect(input.labels?.[0]?.textContent).toContain('Full name')

    await userEvent.fill(input, 'Grace')
    expect(state.text).toBe('Grace')
    state.text = 'Alan'
    await nextTick()
    expect(input.value).toBe('Alan')
    // null and undefined are shown as empty.
    state.text = null
    await nextTick()
    expect(input.value).toBe('')
    state.text = undefined
    await nextTick()
    expect(input.value).toBe('')
  })

  it('routes class/style to the root and every other attribute to the native input', () => {
    setup()
    const input = q<HTMLInputElement>('input')
    const field = root(input)
    expect(field.classList.contains('from-caller')).toBe(true)
    expect(field.style.marginBlock).toBe('3px')
    expect(input.classList.contains('from-caller')).toBe(false)
    expect(input.name).toBe('fullname')
    expect(input.getAttribute('autocomplete')).toBe('name')
    expect(input.getAttribute('inputmode')).toBe('text')
    expect(input.getAttribute('enterkeyhint')).toBe('next')
    expect(input.getAttribute('form')).toBe('some-form')
    expect(input.placeholder).toBe('Ada')
    expect(input.required).toBe(true)
    for (const attribute of ['name', 'autocomplete', 'form', 'placeholder', 'data-testid']) {
      expect(field.hasAttribute(attribute), attribute).toBe(false)
    }
    expect(q('leading').closest('.vui-input')).not.toBeNull()
  })

  it('merges generated hint/error ids with a caller-supplied aria-describedby', async () => {
    const { state } = setup({ describedBy: 'external-a external-b' })
    const input = q<HTMLInputElement>('input')
    const ids = (): string[] => (input.getAttribute('aria-describedby') ?? '').split(' ')
    expect(ids()).toHaveLength(3)
    expect(ids().slice(1)).toEqual(['external-a', 'external-b'])
    expect(document.getElementById(ids()[0] ?? '')?.textContent).toBe('As shown on your profile')

    state.error = 'Required'
    await nextTick()
    expect(ids()).toHaveLength(4)
    expect(input.getAttribute('aria-invalid')).toBe('true')
    expect(document.getElementById(ids()[1] ?? '')?.textContent?.trim()).toBe('Required')

    state.hint = undefined
    state.error = null
    state.describedBy = undefined
    await nextTick()
    expect(input.hasAttribute('aria-describedby')).toBe(false)
    expect(input.hasAttribute('aria-invalid')).toBe(false)
  })

  it('keeps generated ids stable across updates', async () => {
    const { state } = setup()
    const input = q<HTMLInputElement>('input')
    const before = [input.id, input.getAttribute('aria-describedby')]
    state.text = 'x'
    state.error = 'e'
    await nextTick()
    state.error = null
    await nextTick()
    expect([input.id, input.getAttribute('aria-describedby')]).toEqual(before)
    expect(input.id).not.toBe('')
  })

  it('gives controlAttrs.ref the native element (and null on unmount) and composes listeners', async () => {
    const refs: (Element | null)[] = []
    const { state } = setup({
      controlAttrs: {
        name: 'from-control',
        'data-control': 'yes',
        'aria-describedby': 'control-help',
        ref: (element: Element | null) => refs.push(element),
        onBlur: () => state.events.push('control:blur'),
        onFocus: () => state.events.push('control:focus'),
      },
    })
    const input = q<HTMLInputElement>('input')
    // The same native element the component itself references: never a component instance.
    expect(refs).toEqual([input])
    expect(input.name).toBe('from-control')
    expect(input.dataset['control']).toBe('yes')
    expect(input.getAttribute('aria-describedby')).toContain('control-help')

    input.focus()
    input.blur()
    // Neither handler replaced the other.
    expect(state.events).toEqual(['control:focus', 'attr:blur', 'control:blur'])

    state.showInput = false
    await nextTick()
    expect(refs).toEqual([input, null])
  })

  it('exposes focus(), select() and the element; disabled is native', async () => {
    const { state, exposed } = setup()
    const input = q<HTMLInputElement>('input')
    exposed.input()?.focus()
    expect(document.activeElement).toBe(input)
    exposed.input()?.select()
    expect(input.selectionEnd).toBe(3)
    expect(exposed.input()?.element).toBe(input)
    await press('x')
    expect(state.events).toContain('key:x')

    state.disabled = true
    await nextTick()
    expect(input.disabled).toBe(true)
    expect(root(input).hasAttribute('data-disabled')).toBe(true)
  })
})

describe('UiTextarea', () => {
  it('is a native textarea that grows with its content up to maxRows', async () => {
    const { state } = setup()
    const textarea = q<HTMLTextAreaElement>('textarea')
    expect(textarea.tagName).toBe('TEXTAREA')
    expect(textarea.name).toBe('bio')
    expect(textarea.rows).toBe(2)
    await userEvent.fill(textarea, 'one')
    expect(state.textarea).toBe('one')

    // field-sizing: content, bounded by min/max block size.
    expect(getComputedStyle(textarea).getPropertyValue('field-sizing')).toBe('content')
    const short = textarea.getBoundingClientRect().height
    state.textarea = 'one\ntwo\nthree'
    await flush()
    const taller = textarea.getBoundingClientRect().height
    expect(taller).toBeGreaterThan(short)
    state.textarea = Array.from({ length: 30 }, (_, index) => `line ${index}`).join('\n')
    await flush()
    const capped = textarea.getBoundingClientRect().height
    expect(capped).toBeGreaterThan(taller)
    // Capped: it scrolls instead of growing without limit.
    expect(textarea.scrollHeight).toBeGreaterThan(textarea.clientHeight)
    expect(capped).toBeLessThan(short * 3)
  })
})

describe('UiPasswordInput', () => {
  it('toggles visibility with a button whose state is aria-pressed', async () => {
    const { state } = setup()
    const input = q<HTMLInputElement>('password')
    expect(input.type).toBe('password')
    // The caller's autocomplete replaces the default.
    expect(input.getAttribute('autocomplete')).toBe('new-password')
    const toggle = $<HTMLButtonElement>('button', root(input))
    expect(toggle.type).toBe('button')
    expect(toggle.getAttribute('aria-label')).toBe('Show password')
    expect(toggle.getAttribute('aria-pressed')).toBe('false')

    await userEvent.click(toggle)
    expect(state.revealed).toBe(true)
    expect(input.type).toBe('text')
    expect(toggle.getAttribute('aria-pressed')).toBe('true')
    expect(toggle.getAttribute('aria-label')).toBe('Show password')

    await userEvent.fill(input, 'changed')
    expect(state.password).toBe('changed')
  })
})

describe('UiNumberInput', () => {
  it('emits numbers, and null (never 0) for an empty field', async () => {
    const { state } = setup()
    const input = q<HTMLInputElement>('number')
    expect(input.type).toBe('number')
    expect(input.getAttribute('inputmode')).toBe('decimal')
    expect(input.value).toBe('3')
    expect([input.min, input.max, input.step]).toEqual(['0', '10', '0.5'])

    await userEvent.fill(input, '7.5')
    expect(state.amount).toBe(7.5)
    await userEvent.clear(input)
    expect(state.amount).toBeNull()
    expect(state.amount).not.toBe(0)
  })

  it('does not rewrite what the user is typing when the number is unchanged', async () => {
    const { state } = setup({ amount: null })
    const input = q<HTMLInputElement>('number')
    input.focus()
    await press('1.50')
    expect(state.amount).toBe(1.5)
    // The text keeps its trailing zero instead of being replaced by "1.5".
    expect(input.value).toBe('1.50')
  })

  it('follows the parent, including null and undefined', async () => {
    const { state } = setup()
    const input = q<HTMLInputElement>('number')
    state.amount = 9
    await flush()
    expect(input.value).toBe('9')
    state.amount = null
    await flush()
    expect(input.value).toBe('')
    state.amount = 2
    await flush()
    state.amount = undefined
    await flush()
    expect(input.value).toBe('')
  })

  it('treats unparsable text as null and marks the field invalid with a message', async () => {
    const { state } = setup({ amount: 4 })
    const input = q<HTMLInputElement>('number')
    input.focus()
    await userEvent.clear(input)
    // "e" alone is accepted by number inputs but is not a number.
    await press('e')
    expect(input.validity.badInput).toBe(true)
    expect(state.amount).toBeNull()
    expect(input.getAttribute('aria-invalid')).toBe('true')
    expect(description(input)).toBe('Enter a valid number.')
    await userEvent.clear(input)
    await userEvent.fill(input, '5')
    expect(state.amount).toBe(5)
    expect(input.hasAttribute('aria-invalid')).toBe(false)
  })

  it('steps with the optional buttons, respecting step, min and max', async () => {
    const { state } = setup({ amount: 9.5 })
    const input = q<HTMLInputElement>('number')
    const [decrement, increment] = all<HTMLButtonElement>('.vui-input__steppers button', root(input))
    expect([decrement?.getAttribute('aria-label'), increment?.getAttribute('aria-label')]).toEqual([
      'Decrease',
      'Increase',
    ])
    // Pointer conveniences: the field already steps with the arrow keys.
    expect(increment?.tabIndex).toBe(-1)
    await userEvent.click(increment as HTMLButtonElement)
    expect(state.amount).toBe(10)
    await userEvent.click(increment as HTMLButtonElement)
    expect(state.amount).toBe(10)
    await userEvent.click(decrement as HTMLButtonElement)
    expect(state.amount).toBe(9.5)
    input.focus()
    await press('{ArrowDown}')
    expect(state.amount).toBe(9)
  })
})

describe('UiDateInput', () => {
  it('is a native date input whose value is a date-only string, or null', async () => {
    const { state } = setup()
    const input = q<HTMLInputElement>('date')
    expect(input.type).toBe('date')
    expect(input.value).toBe('2026-11-15')
    expect(input.min).toBe('2026-01-01')

    await userEvent.fill(input, '2026-12-31')
    // Exactly the calendar date that was entered: no Date object, no time zone.
    expect(state.date).toBe('2026-12-31')
    expect(typeof state.date).toBe('string')
    await userEvent.clear(input)
    expect(state.date).toBeNull()
    state.date = '2027-01-02'
    await nextTick()
    expect(input.value).toBe('2027-01-02')
  })
})

describe('UiCheckbox', () => {
  it('is a native checkbox inside its label, with hint wiring and form attributes', async () => {
    const { state } = setup()
    const checkbox = q<HTMLInputElement>('checkbox')
    expect(checkbox.type).toBe('checkbox')
    expect(checkbox.closest('label')).not.toBeNull()
    expect([checkbox.name, checkbox.value]).toEqual(['all', 'yes'])
    expect(description(checkbox)).toBe('Applies to every row')

    // Clicking the label text toggles it.
    await userEvent.click($('.vui-check__label', root(checkbox)))
    expect(state.checked).toBe(true)
    expect(checkbox.checked).toBe(true)
    checkbox.focus()
    await press(' ')
    expect(state.checked).toBe(false)
    state.checked = null
    await nextTick()
    expect(checkbox.checked).toBe(false)
  })

  it('sets the native indeterminate property and clears it on the next user toggle', async () => {
    const { state } = setup({ mixed: true })
    const checkbox = q<HTMLInputElement>('checkbox')
    await flush()
    expect(checkbox.indeterminate).toBe(true)
    expect(checkbox.matches(':indeterminate')).toBe(true)
    await userEvent.click(checkbox)
    expect(state.mixed).toBe(false)
    expect(state.checked).toBe(true)
    expect(checkbox.indeterminate).toBe(false)
    state.mixed = true
    await flush()
    expect(checkbox.indeterminate).toBe(true)
  })

  it('reports an error with aria-invalid, a description and required', () => {
    setup()
    const checkbox = q<HTMLInputElement>('checkbox-invalid')
    expect(checkbox.getAttribute('aria-invalid')).toBe('true')
    expect(checkbox.required).toBe(true)
    expect(description(checkbox)).toBe('You must accept.')
  })
})

describe('UiCheckboxGroup', () => {
  it('is a fieldset whose checkboxes update an array in option order', async () => {
    const { state } = setup()
    const group = q<HTMLFieldSetElement>('checkbox-group')
    expect(group.tagName).toBe('FIELDSET')
    expect($('legend', group).textContent?.trim()).toBe('Languages')
    expect(description(group)).toBe('Pick some')
    const boxes = all<HTMLInputElement>('input[type="checkbox"]', group)
    expect(boxes.map((box) => [box.name, box.value, box.checked, box.disabled])).toEqual([
      ['lang', 'ts', true, false],
      ['lang', 'rs', false, false],
      ['lang', 'go', false, true],
    ])
    // An option's description describes that option.
    expect(description(boxes[1] as HTMLInputElement)).toBe('Systems programming')

    await userEvent.click(boxes[1] as HTMLInputElement)
    expect(state.selected).toEqual(['ts', 'rs'])
    await userEvent.click(boxes[0] as HTMLInputElement)
    expect(state.selected).toEqual(['rs'])
    state.selected = ['rs', 'ts']
    await nextTick()
    expect(boxes.map((box) => box.checked)).toEqual([true, true, false])
  })
})

describe('UiRadioGroup', () => {
  it('uses native radios with one name, so arrow keys select within the group', async () => {
    const { state, exposed } = setup()
    const group = q<HTMLFieldSetElement>('radio-group')
    expect($('legend', group).textContent).toContain('Plan')
    const radios = all<HTMLInputElement>('input[type="radio"]', group)
    expect(new Set(radios.map((radio) => radio.name)).size).toBe(1)
    expect(radios[0]?.name).not.toBe('')
    expect(radios.map((radio) => radio.required)).toEqual([true, true, true])
    expect(radios.map((radio) => radio.checked)).toEqual([false, false, false])
    expect(description(radios[0] as HTMLInputElement)).toBe('For individuals')

    exposed.radios()?.focus()
    expect(document.activeElement).toBe(radios[0])
    await press(' ')
    expect(state.plan).toBe(1)
    // Native radio behaviour: the arrow moves focus and selection, skipping the disabled option.
    await press('{ArrowDown}')
    expect(state.plan).toBe(2)
    expect(document.activeElement).toBe(radios[1])
    await press('{ArrowDown}')
    expect(state.plan).toBe(1)

    state.plan = 2
    await nextTick()
    expect(radios.map((radio) => radio.checked)).toEqual([false, true, false])
    exposed.radios()?.focus()
    expect(document.activeElement).toBe(radios[1])
  })
})

describe('UiSwitch', () => {
  it('is a native checkbox with the switch role and no mixed state', async () => {
    const { state } = setup()
    const control = q<HTMLInputElement>('switch')
    expect(control.type).toBe('checkbox')
    expect(control.getAttribute('role')).toBe('switch')
    expect(control.name).toBe('notify')
    expect(description(control)).toBe('Weekly')

    await userEvent.click(control)
    expect(state.on).toBe(true)
    control.focus()
    await press(' ')
    expect(state.on).toBe(false)

    // Something sets the DOM property: the next toggle clears it again.
    control.indeterminate = true
    await userEvent.click(control)
    expect(control.indeterminate).toBe(false)
    expect(state.on).toBe(true)
    // The thumb position, not only the colour, shows the state (wait out the short transition).
    const thumb = $('.vui-switch__thumb', root(control))
    await wait(250)
    const onPosition = thumb.getBoundingClientRect().left
    state.on = false
    await flush()
    await wait(250)
    expect(thumb.getBoundingClientRect().left).toBeLessThan(onPosition)
  })
})

describe('UiSelect', () => {
  it('is a native select that maps string option values back to typed values', async () => {
    const { state } = setup()
    const select = q<HTMLSelectElement>('select')
    expect(select.tagName).toBe('SELECT')
    expect(select.name).toBe('country')
    // null selects the empty option.
    expect(select.value).toBe('')
    expect(select.options[0]?.textContent?.trim()).toBe('Choose')
    expect($('optgroup', select).getAttribute('label')).toBe('Americas')
    expect([...select.options].map((option) => option.value)).toEqual(['', '81', '33', '1', '55'])
    expect(select.options[4]?.disabled).toBe(true)

    await userEvent.selectOptions(select, '33')
    expect(state.country).toBe(33)
    expect(typeof state.country).toBe('number')
    await userEvent.selectOptions(select, '')
    expect(state.country).toBeNull()

    state.country = 1
    await nextTick()
    expect(select.value).toBe('1')
    expect(select.selectedOptions[0]?.textContent?.trim()).toBe('United States')
  })
})

describe('UiSlider', () => {
  it('is a native range input with min, max, step and a readable value', async () => {
    const { state } = setup()
    const slider = q<HTMLInputElement>('slider')
    expect(slider.type).toBe('range')
    expect([slider.min, slider.max, slider.step, slider.value]).toEqual(['0', '50', '5', '20'])
    expect(slider.labels?.[0]?.textContent).toContain('Volume')
    expect(slider.getAttribute('aria-valuetext')).toBe('20 dB')
    const output = $<HTMLOutputElement>('output', root(slider))
    expect(output.textContent).toBe('20 dB')
    expect(output.htmlFor.value).toBe(slider.id)

    slider.focus()
    await press('{ArrowRight}')
    expect(state.volume).toBe(25)
    await press('{End}')
    expect(state.volume).toBe(50)
    await press('{Home}')
    expect(state.volume).toBe(0)
    expect(slider.getAttribute('aria-valuetext')).toBe('0 dB')
    // The filled part of the track follows the value.
    expect(slider.style.getPropertyValue('--_fill')).toBe('0')
    state.volume = 25
    await nextTick()
    expect(slider.value).toBe('25')
    expect(slider.style.getPropertyValue('--_fill')).toBe('0.5')
  })
})

describe('UiFileInput', () => {
  const text = (name: string, content = 'hello'): File => new File([content], name, { type: 'text/plain' })
  const image = (name: string): File =>
    new File([new Uint8Array([137, 80, 78, 71])], name, { type: 'image/png' })

  it('exposes the actual File objects and lists them with remove buttons', async () => {
    const { state } = setup()
    const input = q<HTMLInputElement>('files')
    expect(input.type).toBe('file')
    expect(input.multiple).toBe(true)
    expect(input.accept).toBe('image/*,.txt')
    expect(input.name).toBe('attachments')
    expect(input.labels?.[0]?.textContent).toContain('Attachments')
    expect($('.vui-file__summary', root(input)).textContent).toBe('No file selected')

    const first = text('a.txt')
    const second = text('b.txt', 'longer content')
    await userEvent.upload(input, [first, second])
    expect(state.files).toHaveLength(2)
    expect(state.files[0]).toBeInstanceOf(File)
    expect(state.files.map((file) => file.name)).toEqual(['a.txt', 'b.txt'])
    expect($('.vui-file__summary', root(input)).textContent).toBe('Files selected: 2')

    const list = $('.vui-file__list', root(input))
    expect(list.getAttribute('aria-label')).toBe('Selected files')
    const remove = all<HTMLButtonElement>('button', list)
    expect(remove.map((button) => button.getAttribute('aria-label'))).toEqual([
      'Remove a.txt',
      'Remove b.txt',
    ])
    await userEvent.click(remove[0] as HTMLButtonElement)
    expect(state.files.map((file) => file.name)).toEqual(['b.txt'])
    await flush()
    // The native input (what a form would submit) follows the model.
    expect([...(input.files ?? [])].map((file) => file.name)).toEqual(['b.txt'])
  })

  it('clears through the exposed method, the parent and a native form reset', async () => {
    const { state, exposed } = setup()
    const input = q<HTMLInputElement>('files')
    await userEvent.upload(input, [text('a.txt')])
    exposed.files()?.clear()
    await flush()
    expect(state.files).toEqual([])
    expect(input.files).toHaveLength(0)

    await userEvent.upload(input, [text('b.txt')])
    state.files = []
    await flush()
    expect(input.files).toHaveLength(0)

    await userEvent.upload(input, [text('c.txt')])
    await userEvent.click(q('file-reset'))
    await flush()
    expect(state.resets).toBe(1)
    expect(state.files).toEqual([])
  })

  it('creates preview URLs for images only and releases every one of them', async () => {
    const create = vi.spyOn(URL, 'createObjectURL')
    const revoke = vi.spyOn(URL, 'revokeObjectURL')
    try {
      const { state } = setup({ previews: true })
      const input = q<HTMLInputElement>('files')
      await userEvent.upload(input, [image('a.png'), text('notes.txt'), image('b.png')])
      await flush()
      expect(create).toHaveBeenCalledTimes(2)
      const urls = create.mock.results.map((result) => result.value as string)
      expect(all<HTMLImageElement>('.vui-file__preview').map((preview) => preview.src)).toEqual(urls)

      // Removing one image revokes exactly its URL.
      state.files = state.files.filter((file) => file.name !== 'a.png')
      await flush()
      expect(revoke.mock.calls.map((call) => call[0])).toEqual([urls[0]])

      // Unmounting revokes the rest.
      state.showFiles = false
      await flush()
      expect(revoke.mock.calls.map((call) => call[0]).toSorted()).toEqual([...urls].toSorted())
    } finally {
      create.mockRestore()
      revoke.mockRestore()
    }
  })
})
