import { nextTick, reactive } from 'vue'
import { describe, expect, it } from 'vitest'
import { commands, userEvent } from 'vitest/browser'
import { mountVapor } from '../helpers/mount-vapor.ts'
import FormsHarness from './harness/FormsHarness.vue'
import type { FormsState } from './harness/FormsHarness.vue'
import { $, all, description, flush, maybe, press, q, referenced, until } from './support.ts'

interface Exposed {
  requestSubmit(): void
  reset(): void
  element(): HTMLFormElement | null | undefined
  store(): {
    isSubmitting: boolean
    isTouched: boolean
    isDirty: boolean
    isValid: boolean
    errors: readonly string[] | null
  }
  /** Everything Formisch holds for a field, ungated. */
  fieldErrors(name: 'email' | 'city'): readonly string[] | null
}

function setup(overrides: Partial<FormsState> = {}) {
  const state = reactive<FormsState>({
    locale: 'en',
    outputs: [],
    events: [],
    hold: false,
    release: null,
    ...overrides,
  })
  const view = mountVapor(FormsHarness, { props: { state } })
  const exposed = view.app._instance?.exposed as Exposed
  return { state, view, exposed }
}

const input = (testId: string): HTMLInputElement => q<HTMLInputElement>(testId)
const errorOf = (testId: string): string =>
  referenced(q(testId), 'aria-describedby')
    .filter((element) => element.classList.contains('sora-field__error'))
    .map((element) => element.textContent?.trim() ?? '')
    .join(' | ')

async function type(testId: string, value: string): Promise<void> {
  const element = input(testId)
  element.focus()
  await userEvent.fill(element, value)
  await nextTick()
}

const option = (group: string, value: string): HTMLInputElement =>
  $<HTMLInputElement>(`input[value="${value}"]`, q(group))

async function fillValid(): Promise<void> {
  await type('email', 'ada@example.com')
  await userEvent.selectOptions(q('plan'), 'pro')
  await userEvent.click(option('contact', 'email'))
  await userEvent.click(option('topics', 'product'))
  await userEvent.click(q('terms'))
  await nextTick()
}

/** Wait until Formisch has finished the (asynchronous) validation and submission. */
const settled = (exposed: Exposed): Promise<void> => until(() => !exposed.store().isSubmitting)

const summaryLines = (testId = 'summary'): string[] =>
  all('li', q(testId)).map((item) => item.textContent?.replace(/\s+/g, ' ').trim() ?? '')

describe('useSoraFormField', () => {
  it('hands Formisch the native controls, named by their JSON path', () => {
    const { exposed } = setup()
    const form = q<HTMLFormElement>('form')
    expect(form.tagName).toBe('FORM')
    expect(exposed.element()).toBe(form)
    // Validation belongs to the schema; the browser's own bubbles are off.
    expect(form.noValidate).toBe(true)
    expect(form.elements.namedItem('["email"]')).toBe(input('email'))
    expect(form.elements.namedItem('["address","city"]')).toBe(input('city'))
    expect(form.elements.namedItem('["plan"]')).toBe(q('plan'))
    expect(form.elements.namedItem('["terms"]')).toBe(input('terms'))
    // Groups register every native option under the one field name.
    expect(
      all<HTMLInputElement>('[name=\'["contact"]\']', form).map((radio) => [radio.type, radio.value]),
    ).toEqual([
      ['radio', 'email'],
      ['radio', 'phone'],
    ])
    expect(all<HTMLInputElement>('[name=\'["topics"]\']', form).map((box) => [box.type, box.value])).toEqual([
      ['checkbox', 'product'],
      ['checkbox', 'security'],
      ['checkbox', 'events'],
    ])
    expect(q('contact').tagName).toBe('FIELDSET')
    expect(input('email').tagName).toBe('INPUT')
    expect(q('plan').tagName).toBe('SELECT')
    expect(input('terms').type).toBe('checkbox')
    // Initial input reaches the controls.
    expect(input('city').value).toBe('Tokyo')
    expect(input('email').value).toBe('')
    expect(q('flags').textContent).toBe('idle|valid|pristine')
  })

  it('reveals the message of a field once that field was left, and revalidates while typing', async () => {
    const { exposed } = setup()
    await type('email', 'not-an-email')
    expect(input('email').hasAttribute('aria-invalid')).toBe(false)
    await press('{Tab}')
    await until(() => input('email').getAttribute('aria-invalid') === 'true')
    expect(errorOf('email')).toBe('Enter a valid email address.')
    // The hint stays associated next to the error.
    expect(description(input('email'))).toBe('Used for sign-in | Enter a valid email address.')
    expect(q('flags').textContent).toBe('idle|invalid|dirty')

    // Formisch validated the whole form and holds errors for every field, but
    // fields the user has not reached yet stay quiet, and so does the summary.
    expect(exposed.store().isValid).toBe(false)
    expect(q('plan').hasAttribute('aria-invalid')).toBe(false)
    expect(input('terms').hasAttribute('aria-invalid')).toBe(false)
    expect(errorOf('plan')).toBe('')
    expect(maybe('summary')).toBeNull()

    // Focusing an untouched field is not "leaving" it: still nothing.
    q('plan').focus()
    await flush()
    expect(errorOf('plan')).toBe('')
    await press('{Tab}')
    await until(() => errorOf('plan') === 'This field is required.')

    await type('email', 'ada@example.com')
    await until(() => !input('email').hasAttribute('aria-invalid'))
    expect(errorOf('email')).toBe('')
    expect(description(input('email'))).toBe('Used for sign-in')
  })

  it('shows the first message of a field by default (a pipe reports every failed rule)', async () => {
    const { exposed } = setup()
    input('email').focus()
    await press('{Tab}')
    await until(() => errorOf('email') !== '')
    // An empty email fails both "required" and "email"; only the first is shown.
    expect(errorOf('email')).toBe('This field is required.')
    expect(exposed.fieldErrors('email')).toEqual(['This field is required.', 'Enter a valid email address.'])
  })

  it('holds a message back while a button is pressed, so the button does not move under the pointer', async () => {
    const { exposed } = setup()
    await type('city', '')
    const button = q('add-tag')
    // Layout position: a pressed button also shrinks a little (press feedback), which is not a move.
    const top = (): number => button.offsetTop
    const before = top()

    // Pointer down on the button blurs the field, which validates it...
    await userEvent.hover(button)
    await commands.mouseDown()
    await until(() => exposed.fieldErrors('city') !== null)
    await flush()
    // ...but the message is not on screen yet and the button has not moved.
    expect(errorOf('city')).toBe('')
    expect(top()).toBe(before)

    await commands.mouseUp()
    await until(() => errorOf('city') === 'This field is required.')
    // The click arrived (a row was added) and the layout moved only afterwards.
    expect(all('[data-testid="tag-row"]')).toHaveLength(1)
    expect(top()).toBeGreaterThan(before)
  })

  it('maps an emptied control to "no value" so optional fields pass', async () => {
    const { state, exposed } = setup()
    await fillValid()
    await type('age', '12')
    await press('{Tab}')
    await until(() => errorOf('age') === 'Enter a value of 18 or more.')
    await type('age', '')
    await until(() => errorOf('age') === '')

    await userEvent.click(q('submit'))
    await settled(exposed)
    expect(state.outputs).toHaveLength(1)
    expect(state.outputs[0]).toEqual({
      email: 'ada@example.com',
      plan: 'pro',
      contact: 'email',
      topics: ['product'],
      address: { city: 'Tokyo' },
      tags: [],
      terms: true,
    })

    await type('age', '42')
    await userEvent.click(q('submit'))
    await settled(exposed)
    expect((state.outputs[1] as { age: number }).age).toBe(42)
  })
})

describe('SoraForm', () => {
  it('validates on submit, focuses the first invalid control and reports "invalid"', async () => {
    const { state, exposed } = setup()
    await userEvent.click(q('submit'))
    await settled(exposed)
    await flush()
    expect(state.outputs).toEqual([])
    expect(state.events).toEqual(['invalid'])
    expect(document.activeElement).toBe(input('email'))
    expect(errorOf('email')).toBe('This field is required.')
    expect(errorOf('plan')).toBe('This field is required.')
    expect(errorOf('terms')).toBe('You must accept this to continue.')
    // Group errors are announced through the fieldset, and every option is marked invalid.
    expect(description(q('contact'))).toBe('This field is required.')
    expect(description(q('topics'))).toBe('This field is required.')
    expect(option('contact', 'phone').getAttribute('aria-invalid')).toBe('true')
    expect(q('flags').textContent).toBe('idle|invalid|pristine')
  })

  it('awaits the submit callback and stays busy until it settles', async () => {
    const { state, exposed } = setup({ hold: true })
    await fillValid()
    const form = q('form')
    const submit = q<HTMLButtonElement>('submit')
    await userEvent.click(submit)
    await until(() => state.release !== null)

    expect(state.outputs).toHaveLength(1)
    expect(exposed.store().isSubmitting).toBe(true)
    expect(form.getAttribute('aria-busy')).toBe('true')
    expect(q('flags').textContent).toBe('submitting|valid|dirty')
    // The loading button keeps its label and focusability; it is aria-disabled, not disabled.
    expect(submit.getAttribute('aria-disabled')).toBe('true')
    expect(submit.disabled).toBe(false)
    expect(submit.textContent?.trim()).toBe('Save')
    // "submitted" is emitted only after the promise resolves.
    expect(state.events).toEqual([])

    state.release?.()
    await settled(exposed)
    await nextTick()
    expect(state.events).toEqual(['submitted'])
    expect(form.hasAttribute('aria-busy')).toBe(false)
    expect(submit.hasAttribute('aria-disabled')).toBe(false)
  })

  it('ignores duplicate submissions from the button, Enter and requestSubmit()', async () => {
    const { state, exposed } = setup({ hold: true })
    await fillValid()
    const submit = q<HTMLButtonElement>('submit')
    await userEvent.click(submit)
    await until(() => state.release !== null)

    await userEvent.click(submit, { force: true })
    input('email').focus()
    await press('{Enter}')
    exposed.requestSubmit()
    q<HTMLFormElement>('form').requestSubmit()
    await flush()
    expect(state.outputs).toHaveLength(1)

    state.release?.()
    await settled(exposed)
    expect(state.events).toEqual(['submitted'])

    // Once it has settled the form can be submitted again, also through requestSubmit().
    exposed.requestSubmit()
    await until(() => state.release !== null)
    expect(state.outputs).toHaveLength(2)
    state.release?.()
    await settled(exposed)
    expect(state.events).toEqual(['submitted', 'submitted'])
  })

  it('submits on Enter in a field (implicit submission)', async () => {
    const { state, exposed } = setup()
    await fillValid()
    input('email').focus()
    await press('{Enter}')
    await settled(exposed)
    expect(state.outputs).toHaveLength(1)
    expect(state.events).toEqual(['submitted'])
  })

  it('turns a rejected submit into a form-level error that is announced', async () => {
    const { state, exposed } = setup({ hold: true })
    await fillValid()
    await userEvent.click(q('submit'))
    await until(() => state.release !== null)
    state.release?.(new Error('The server rejected the change.'))
    await settled(exposed)
    await flush()

    expect(state.events).toEqual(['error:The server rejected the change.'])
    expect(exposed.store().errors).toEqual(['The server rejected the change.'])
    const summary = q('summary')
    // No field can announce a form-level error, so the summary is an alert.
    expect(summary.getAttribute('role')).toBe('alert')
    expect(summaryLines()).toEqual(['The server rejected the change.'])
    expect(summary.querySelector('a')).toBeNull()
    expect(q('form').hasAttribute('aria-busy')).toBe(false)

    // The values are intact and the next attempt can succeed.
    expect(input('email').value).toBe('ada@example.com')
    await userEvent.click(q('submit'))
    await until(() => state.release !== null)
    state.release?.()
    await settled(exposed)
    await flush()
    expect(state.events).toEqual(['error:The server rejected the change.', 'submitted'])
    expect(maybe('summary')).toBeNull()
  })

  it('resets the store (not just the DOM) from a reset button and from the exposed method', async () => {
    const { exposed } = setup()
    await type('email', 'nope')
    await type('city', '')
    await userEvent.click(q('add-tag'))
    await userEvent.click(q('submit'))
    await settled(exposed)
    await flush()
    expect(errorOf('email')).toBe('Enter a valid email address.')
    expect(all('[data-testid="tag-row"]')).toHaveLength(1)

    await userEvent.click(q('reset'))
    await flush()
    expect(input('email').value).toBe('')
    expect(input('city').value).toBe('Tokyo')
    expect(errorOf('email')).toBe('')
    expect(input('email').hasAttribute('aria-invalid')).toBe(false)
    expect(all('[data-testid="tag-row"]')).toHaveLength(0)
    expect(maybe('summary')).toBeNull()
    expect(q('flags').textContent).toBe('idle|valid|pristine')

    await type('city', 'Kyoto')
    expect(q('flags').textContent).toBe('idle|valid|dirty')
    exposed.reset()
    await flush()
    expect(input('city').value).toBe('Tokyo')
    expect(q('flags').textContent).toBe('idle|valid|pristine')
  })

  it('adds and removes array rows without mixing up their values', async () => {
    const { state, exposed } = setup()
    await fillValid()
    await userEvent.click(q('add-tag'))
    await userEvent.click(q('add-tag'))
    await userEvent.click(q('add-tag'))
    await flush()
    const tagInputs = (): HTMLInputElement[] => all<HTMLInputElement>('[data-testid="tag"]')
    expect(tagInputs().map((element) => element.name)).toEqual(['["tags",0]', '["tags",1]', '["tags",2]'])

    await userEvent.fill(tagInputs()[0] as HTMLInputElement, 'alpha')
    await userEvent.fill(tagInputs()[1] as HTMLInputElement, 'beta')
    await userEvent.fill(tagInputs()[2] as HTMLInputElement, 'gamma')
    const third = tagInputs()[2]

    // Removing the middle row keeps the other rows' elements, values and order.
    await userEvent.click(all('[data-testid="tag-remove"]')[1] as HTMLElement)
    await flush()
    expect(tagInputs().map((element) => element.value)).toEqual(['alpha', 'gamma'])
    expect(tagInputs().map((element) => element.name)).toEqual(['["tags",0]', '["tags",1]'])
    expect(tagInputs()[1]).toBe(third)
    expect(all('[data-testid="tag-row"] label').map((label) => label.textContent?.trim())).toEqual([
      'Tag 1',
      'Tag 2',
    ])

    await userEvent.click(q('submit'))
    await settled(exposed)
    expect((state.outputs[0] as { tags: string[] }).tags).toEqual(['alpha', 'gamma'])
  })

  it('regenerates visible messages when the locale changes, and nothing else', async () => {
    const { state, exposed } = setup()
    await type('email', 'nope')
    await press('{Tab}')
    await until(() => errorOf('email') === 'Enter a valid email address.')
    const touchedBefore = exposed.store().isTouched

    state.locale = 'ja'
    await until(() => errorOf('email') === '有効なメールアドレスを入力してください。')
    // Values and interaction state are untouched...
    expect(input('email').value).toBe('nope')
    expect(exposed.store().isTouched).toBe(touchedBefore)
    expect(q('flags').textContent).toBe('idle|invalid|dirty')
    // ...and fields that showed no message before do not get one from the re-validation.
    expect(errorOf('plan')).toBe('')
    expect(errorOf('terms')).toBe('')
    expect(q('plan').hasAttribute('aria-invalid')).toBe(false)
    expect(maybe('summary')).toBeNull()
    // The provider also sets the language for assistive technology.
    expect(q('form').closest('[lang]')?.getAttribute('lang')).toBe('ja')

    // After a submission attempt the summary follows the language as well.
    await userEvent.click(q('submit'))
    await settled(exposed)
    await until(() => maybe('summary') !== null)
    expect(summaryLines()[0]).toBe('Email: 有効なメールアドレスを入力してください。')
    state.locale = 'en'
    await until(() => errorOf('email') === 'Enter a valid email address.')
    await until(() => summaryLines()[0] === 'Email: Enter a valid email address.')
    expect(summaryLines()).toEqual([
      'Email: Enter a valid email address.',
      'Plan: This field is required.',
      'Contact method: This field is required.',
      'Topics: This field is required.',
      'I accept the terms: You must accept this to continue.',
    ])
  })
})

describe('SoraFormErrorSummary', () => {
  it('lists every error, including nested and array fields, with links that focus the control', async () => {
    const { exposed } = setup()
    expect(maybe('summary')).toBeNull()
    await type('city', '')
    await userEvent.click(q('add-tag'))
    await userEvent.click(q('submit'))
    await settled(exposed)
    await flush()

    const summary = q('summary')
    // Focus is already on the first invalid field, so this is a labelled group, not an alert.
    expect(summary.getAttribute('role')).toBe('group')
    const [title] = referenced(summary, 'aria-labelledby')
    expect(title?.tagName).toBe('H2')
    expect(title?.textContent?.trim()).toBe('There is a problem')
    // A group is named by its legend; a control inside a plain fieldset keeps its own label.
    expect(summaryLines()).toEqual([
      'Email: This field is required.',
      'Plan: This field is required.',
      'Contact method: This field is required.',
      'Topics: This field is required.',
      'City: This field is required.',
      'Tag 1: This field is required.',
      'I accept the terms: You must accept this to continue.',
    ])

    const links = all<HTMLAnchorElement>('a', summary)
    expect(links.map((link) => link.getAttribute('href'))).toEqual(
      [
        input('email'),
        q('plan'),
        option('contact', 'email'),
        option('topics', 'product'),
        input('city'),
        input('tag'),
        input('terms'),
      ].map((control) => `#${control.id}`),
    )
    await userEvent.click(links[4] as HTMLElement)
    expect(document.activeElement).toBe(input('city'))
    // A group link focuses its first option.
    links[2]?.focus()
    await press('{Enter}')
    expect(document.activeElement).toBe(option('contact', 'email'))

    // Fixing a field removes its line.
    await type('city', 'Osaka')
    await until(() => summaryLines().length === 6)
    expect(summaryLines().some((line) => line.startsWith('City'))).toBe(false)
  })

  it('works outside a SoraForm with an explicit store, a custom title and an entry slot', async () => {
    const { exposed } = setup()
    expect(maybe('summary-outside')).toBeNull()
    await userEvent.click(q('submit'))
    await settled(exposed)
    await flush()
    const outside = q('summary-outside')
    expect($('h3', outside).textContent?.trim()).toBe('Fix these fields')
    expect(all('[data-testid="summary-entry"]', outside).map((entry) => entry.textContent)).toEqual([
      'email: This field is required.',
      'plan: This field is required.',
      'contact: This field is required.',
      'topics: This field is required.',
      'terms: You must accept this to continue.',
    ])
    await userEvent.click(all('[data-testid="summary-entry"]', outside)[1] as HTMLElement)
    expect(document.activeElement).toBe(q('plan'))
  })
})
