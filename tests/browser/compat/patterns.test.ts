/**
 * Vapor behaviours the component layer is built on (wrapper attribute
 * routing, ref merging, slot forwarding, generics, provide/inject, dynamic
 * elements, object v-bind with a model).
 */
import { nextTick, reactive } from 'vue'
import { describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import PatternApp, { type PatternState } from '../../fixtures/compat/PatternApp.vue'
import { mountVapor } from '../../helpers/mount-vapor.ts'

const setup = () => {
  const bound = reactive({ value: 2 as number | null })
  const state = reactive<PatternState>({
    value: 1,
    showHint: false,
    extraClass: 'a',
    describedBy: undefined,
    refs: [],
    changes: 0,
    as: 'select',
    bind: {
      get modelValue() {
        return bound.value
      },
      'onUpdate:modelValue': (value: number | null) => {
        bound.value = value
      },
    },
  })
  const view = mountVapor(PatternApp, { props: { state } })
  const fields = () => [...view.container.querySelectorAll<HTMLElement>('[data-testid="pattern-field"]')]
  const selects = () => [
    ...view.container.querySelectorAll<HTMLSelectElement>('[data-testid="pattern-select"]'),
  ]
  return { state, bound, view, fields, selects }
}

describe('wrapper attribute routing', () => {
  it('keeps class/style on the root and sends everything else to the native control', async () => {
    const { state, fields, selects } = setup()
    const root = fields()[0]!
    const select = selects()[0]!
    expect(root.className).toBe('pattern-field from-parent a')
    expect(root.style.margin).toBe('1px')
    expect(root.hasAttribute('name')).toBe(false)
    expect(select.name).toBe('count')
    expect(select.classList.contains('from-parent')).toBe(false)
    expect(select.dataset['control']).toBe('yes')

    state.extraClass = 'b'
    state.describedBy = 'external'
    await nextTick()
    expect(root.className).toBe('pattern-field from-parent b')
    expect(select.getAttribute('aria-describedby')).toBe('external')
  })

  it('merges generated and caller aria-describedby ids when the hint slot appears', async () => {
    const { state, view, selects } = setup()
    expect(view.container.querySelector('[data-testid="pattern-hint"]')).toBeNull()
    state.describedBy = 'external'
    state.showHint = true
    await nextTick()
    const hint = view.container.querySelector<HTMLElement>('[data-testid="pattern-hint"]')!
    expect(hint.textContent).toBe('hint text')
    expect(selects()[0]!.getAttribute('aria-describedby')).toBe(`${hint.id} external`)
    expect(selects()[0]!.id).toBe(view.container.querySelector('label')!.htmlFor)
  })
})

describe('refs', () => {
  it('hands the caller ref the native element once and null on unmount, alongside the own ref', async () => {
    const { state, view } = setup()
    expect(state.refs).toEqual(['SELECT'])
    view.unmount()
    await nextTick()
    expect(state.refs).toEqual(['SELECT', null])
  })
})

describe('models, generics and listeners', () => {
  it('updates a generic model from the native control and from the parent', async () => {
    const { state, selects } = setup()
    const select = selects()[0]!
    expect(select.selectedIndex).toBe(0)
    expect([...select.options].map((option) => option.textContent)).toEqual(['0:One', '1:Two', '2:Three'])

    await userEvent.selectOptions(select, select.options[2]!)
    expect(state.value).toBe(3)
    expect(state.changes).toBe(1)

    state.value = 2
    await nextTick()
    expect(select.selectedIndex).toBe(1)
  })

  it('accepts modelValue/onUpdate:modelValue through an object v-bind', async () => {
    const { bound, selects } = setup()
    const select = selects()[1]!
    expect(select.selectedIndex).toBe(1)
    expect(select.hasAttribute('data-second')).toBe(true)
    await userEvent.selectOptions(select, select.options[0]!)
    expect(bound.value).toBe(1)
    bound.value = 3
    await nextTick()
    expect(select.selectedIndex).toBe(2)
  })
})

describe('provide/inject and dynamic elements', () => {
  it('injects a provided computed and switches the dynamic tag', async () => {
    const { state, view } = setup()
    const dynamic = () => view.container.querySelector<HTMLElement>('[data-testid="pattern-dynamic"]')!
    expect(dynamic().tagName).toBe('SPAN')
    expect(dynamic().dataset['tone']).toBe('tone:warm')
    state.as = 'div'
    await nextTick()
    expect(dynamic().tagName).toBe('DIV')
  })
})
