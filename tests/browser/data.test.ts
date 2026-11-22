import { nextTick, reactive } from 'vue'
import { describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { mountVapor } from '../helpers/mount-vapor.ts'
import DataHarness, { type DataState, type Member } from './harness/DataHarness.vue'
import { $, all, flush, press, q, referenced, until } from './support.ts'

const members: Member[] = [
  { id: 1, name: 'Grace', role: 'Engineer', seats: 1200, active: true },
  { id: 2, name: 'Ada', role: 'Designer', seats: 3, active: false },
  { id: 3, name: 'Linus', role: 'Maintainer', seats: 40, active: true },
]

const setup = (overrides: Partial<DataState> = {}) => {
  const state = reactive<DataState>({
    rows: structuredClone(members),
    sort: null,
    selected: [],
    loading: false,
    selectable: false,
    width: '48rem',
    caption: 'Team members',
    locale: 'en',
    ...overrides,
  })
  const view = mountVapor(DataHarness, { props: { state } })
  return { state, view }
}

const table = (testId = 'table'): HTMLTableElement => $<HTMLTableElement>('table', q(testId))
const bodyRows = (testId = 'table'): HTMLTableRowElement[] =>
  all<HTMLTableRowElement>('tbody > tr', q(testId))
const names = (): string[] => bodyRows().map((row) => $('th[scope="row"]', row).textContent?.trim() ?? '')
const header = (label: string, testId = 'table'): HTMLTableCellElement => {
  const found = all<HTMLTableCellElement>('thead th', q(testId)).find(
    (cell) => cell.textContent?.trim() === label,
  )
  if (!found) throw new Error(`no column "${label}"`)
  return found
}
const checkboxes = (): HTMLInputElement[] => all<HTMLInputElement>('input[type="checkbox"]', q('table'))

describe('SoraTable', () => {
  it('renders a real table: caption, column headers and row headers', () => {
    setup()
    const element = table()
    expect(element.getAttribute('role')).toBeNull()
    expect(q('table').querySelector('[role="grid"], [role="row"], [role="gridcell"]')).toBeNull()
    expect(element.caption?.textContent?.trim()).toBe('Team members')
    expect(
      all('thead th', q('table')).map((cell) => [cell.textContent?.trim(), cell.getAttribute('scope')]),
    ).toEqual([
      ['Name', 'col'],
      ['Role', 'col'],
      ['Seats', 'col'],
      ['Status', 'col'],
    ])
    expect(names()).toEqual(['Grace', 'Ada', 'Linus'])
    const first = bodyRows()[0] as HTMLTableRowElement
    expect([...first.cells].map((cell) => cell.tagName)).toEqual(['TH', 'TD', 'TD', 'TD'])
    // Numbers are formatted for the locale; accessors and `cell-<key>` slots render custom content.
    expect(first.cells[2]?.textContent?.trim()).toBe('1,200')
    expect(first.cells[2]?.dataset['align']).toBe('end')
    expect(getComputedStyle(first.cells[2] as Element).textAlign).toBe('end')
    expect($('[data-testid="status-badge"]', first).textContent?.trim()).toBe('Active')
    expect(header('Role').style.inlineSize).toBe('12rem')
  })

  it('keeps a hidden caption in the accessibility tree', () => {
    setup()
    const caption = table('table-plain').caption as HTMLElement
    expect(caption.textContent?.trim()).toBe('Hidden caption')
    const box = caption.getBoundingClientRect()
    expect(box.width).toBeLessThanOrEqual(1)
    expect(box.height).toBeLessThanOrEqual(1)
    expect(getComputedStyle(caption).display).not.toBe('none')
    expect(table('table-plain').dataset['size']).toBe('sm')
    expect(table('table-plain').hasAttribute('data-striped')).toBe(true)
  })

  it('formats numbers for the provider locale', () => {
    setup({ locale: 'de' })
    expect(bodyRows()[0]?.cells[2]?.textContent?.trim()).toBe(new Intl.NumberFormat('de').format(1200))
    expect(bodyRows()[0]?.cells[2]?.textContent?.trim()).not.toBe('1,200')
  })

  it('reports sorting through aria-sort and a three-step cycle, and never sorts rows itself', async () => {
    const { state } = setup()
    expect(header('Name').getAttribute('aria-sort')).toBe('none')
    expect(header('Seats').getAttribute('aria-sort')).toBe('none')
    // Columns that cannot be sorted carry no aria-sort and no button.
    expect(header('Role').hasAttribute('aria-sort')).toBe(false)
    expect(header('Role').querySelector('button')).toBeNull()

    const sortName = $<HTMLButtonElement>('button', header('Name'))
    expect(sortName.type).toBe('button')
    expect(sortName.title).toBe('Sort by Name')
    await userEvent.click(sortName)
    expect(state.sort).toEqual({ key: 'name', direction: 'ascending' })
    expect(header('Name').getAttribute('aria-sort')).toBe('ascending')
    expect(names()).toEqual(['Ada', 'Grace', 'Linus'])

    sortName.focus()
    await press('{Enter}')
    expect(state.sort).toEqual({ key: 'name', direction: 'descending' })
    expect(header('Name').getAttribute('aria-sort')).toBe('descending')
    expect(names()).toEqual(['Linus', 'Grace', 'Ada'])

    await press(' ')
    expect(state.sort).toBeNull()
    expect(header('Name').getAttribute('aria-sort')).toBe('none')
    expect(names()).toEqual(['Grace', 'Ada', 'Linus'])

    // Only one column is sorted at a time.
    await userEvent.click($('button', header('Seats')))
    expect(header('Seats').getAttribute('aria-sort')).toBe('ascending')
    expect(header('Name').getAttribute('aria-sort')).toBe('none')
    expect(names()).toEqual(['Ada', 'Linus', 'Grace'])
  })

  it('selects rows with labelled checkboxes and a mixed-state "select all"', async () => {
    const { state } = setup({ selectable: true, selected: [99] })
    const [selectAll, grace, ada, linus] = checkboxes() as [
      HTMLInputElement,
      HTMLInputElement,
      HTMLInputElement,
      HTMLInputElement,
    ]
    expect(selectAll.getAttribute('aria-label')).toBe('Select all rows')
    expect(grace.getAttribute('aria-label')).toBe('Select row Grace')
    expect(ada.getAttribute('aria-label')).toBe('Select row Ada')
    expect(selectAll.checked).toBe(false)
    expect(selectAll.indeterminate).toBe(false)

    await userEvent.click(ada)
    expect(state.selected).toEqual([99, 2])
    await flush()
    expect(selectAll.indeterminate).toBe(true)
    expect(bodyRows()[1]?.hasAttribute('data-selected')).toBe(true)
    expect(bodyRows()[0]?.hasAttribute('data-selected')).toBe(false)

    // "Select all" covers the rows of this table and keeps keys it does not show.
    await userEvent.click(selectAll)
    expect(state.selected).toEqual([99, 1, 2, 3])
    await flush()
    expect(selectAll.checked).toBe(true)
    expect(selectAll.indeterminate).toBe(false)
    expect([grace.checked, ada.checked, linus.checked]).toEqual([true, true, true])

    await userEvent.click(linus)
    expect(state.selected).toEqual([99, 1, 2])
    await userEvent.click(selectAll)
    await flush()
    await userEvent.click(selectAll)
    expect(state.selected).toEqual([99])
  })

  it('follows selection and rows changed by the owner', async () => {
    const { state } = setup({ selectable: true })
    state.selected = [3]
    await flush()
    expect(checkboxes().map((box) => box.checked)).toEqual([false, false, false, true])
    expect(checkboxes()[0]?.indeterminate).toBe(true)

    state.rows = state.rows.filter((row) => row.id !== 1)
    await flush()
    expect(names()).toEqual(['Ada', 'Linus'])
    // Row identity comes from rowKey, so the remaining selection sticks to its row.
    expect(checkboxes().map((box) => box.checked)).toEqual([false, false, true])
  })

  it('shows an empty state that spans every column', () => {
    setup()
    const cell = $<HTMLTableCellElement>('tbody td', q('table-plain'))
    expect(cell.textContent?.trim()).toBe('Nothing here yet')
    expect(cell.colSpan).toBe(4)

    expect(q('empty-slot').textContent).toBe('No members')
    const withSelection = $<HTMLTableCellElement>('tbody td', q('table-empty-slot'))
    expect(withSelection.colSpan).toBe(5)
    // Nothing to select: "select all" is disabled rather than silently doing nothing.
    expect($<HTMLInputElement>('thead input[type="checkbox"]', q('table-empty-slot')).disabled).toBe(true)
  })

  it('falls back to the translated empty text', async () => {
    const { state } = setup({ rows: [] })
    expect($('tbody td', q('table')).textContent?.trim()).toBe('No data to display')
    state.rows = members.slice(0, 1)
    await nextTick()
    expect(names()).toEqual(['Grace'])
  })

  it('announces loading, with placeholders only when there are no rows yet', async () => {
    const { state } = setup({ rows: [], loading: true })
    expect(table().getAttribute('aria-busy')).toBe('true')
    const status = $('[role="status"]', q('table'))
    expect(status.textContent?.trim()).toBe('Loading data')
    expect(bodyRows()).toHaveLength(3)
    expect(bodyRows().every((row) => row.getAttribute('aria-hidden') === 'true')).toBe(true)
    expect(all('.sora-skeleton', q('table')).length).toBe(12)

    // Refreshing existing data keeps the rows in place.
    state.rows = structuredClone(members)
    await nextTick()
    expect(names()).toEqual(['Grace', 'Ada', 'Linus'])
    expect(table().getAttribute('aria-busy')).toBe('true')

    state.loading = false
    await nextTick()
    expect(table().hasAttribute('aria-busy')).toBe(false)
    expect(q('table').querySelector('[role="status"]')).toBeNull()
  })

  it('becomes a focusable, labelled scroll region only when it overflows', async () => {
    const { state } = setup()
    const wrap = q('table')
    expect(wrap.classList.contains('sora-table-wrap')).toBe(true)
    expect(wrap.hasAttribute('role')).toBe(false)
    expect(wrap.hasAttribute('tabindex')).toBe(false)

    state.width = '14rem'
    await until(() => wrap.getAttribute('role') === 'region')
    expect(wrap.tabIndex).toBe(0)
    expect(referenced(wrap, 'aria-labelledby')).toEqual([table().caption])
    // The page itself does not scroll sideways; the region does, from the keyboard.
    expect(q('table-box').scrollWidth).toBeLessThanOrEqual(q('table-box').clientWidth)
    expect(wrap.scrollWidth).toBeGreaterThan(wrap.clientWidth)
    wrap.focus()
    expect(document.activeElement).toBe(wrap)
    await press('{ArrowRight}')
    await until(() => wrap.scrollLeft > 0)

    state.caption = undefined
    await flush()
    expect(wrap.hasAttribute('aria-labelledby')).toBe(false)
    expect(wrap.getAttribute('aria-label')).toBe('Table, scrollable')

    state.width = '48rem'
    await until(() => !wrap.hasAttribute('role'))
    expect(wrap.hasAttribute('tabindex')).toBe(false)
    expect(wrap.hasAttribute('aria-label')).toBe(false)
  })

  it('supports header and generic cell slots, and function row keys', () => {
    setup()
    expect(all('thead th em', q('table-slots')).map((cell) => cell.textContent)).toEqual([
      'Name!',
      'Role!',
      'Seats!',
      'Status!',
    ])
    expect(all('[data-testid="generic-cell"]', q('table-slots')).map((cell) => cell.textContent)).toEqual([
      '0:Grace',
      '0:Engineer',
      '0:1200',
      '0:Active',
    ])
  })
})
