import { nextTick, reactive } from 'vue'
import { describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { mountVapor } from '../helpers/mount-vapor.ts'
import NavigationHarness, { type NavigationState } from './harness/NavigationHarness.vue'
import { $, all, flush, press, q, referenced } from './support.ts'

const setup = (overrides: Partial<NavigationState> = {}, containerAttrs: Record<string, string> = {}) => {
  const state = reactive<NavigationState>({
    tab: 'profile',
    activation: 'automatic',
    orientation: 'horizontal',
    open: ['q1'],
    multiple: false,
    collapsible: true,
    page: 5,
    pageCount: 10,
    paginationWidth: '40rem',
    paginationDisabled: false,
    locale: 'en',
    ...overrides,
  })
  const view = mountVapor(NavigationHarness, { props: { state }, containerAttrs })
  return { state, view }
}

const tabsOf = (): HTMLButtonElement[] => all<HTMLButtonElement>('[role="tab"]', q('tabs'))
const tab = (label: string): HTMLButtonElement => {
  const found = tabsOf().find((element) => element.textContent?.trim() === label)
  if (!found) throw new Error(`no tab "${label}"`)
  return found
}
const selectedTab = (): string | undefined =>
  tabsOf()
    .find((element) => element.getAttribute('aria-selected') === 'true')
    ?.textContent?.trim()

describe('SoraTabs', () => {
  it('exposes the APG tabs pattern: tablist, tabs and one labelled panel', () => {
    setup()
    const list = $('[role="tablist"]', q('tabs'))
    expect(list.getAttribute('aria-label')).toBe('Account sections')
    expect(list.getAttribute('aria-orientation')).toBe('horizontal')
    expect(tabsOf().map((element) => element.textContent?.trim())).toEqual([
      'Profile',
      'Billing',
      'Team',
      'Security',
    ])
    expect(tabsOf().map((element) => element.getAttribute('aria-selected'))).toEqual([
      'true',
      'false',
      'false',
      'false',
    ])
    expect(tabsOf().every((element) => element.tagName === 'BUTTON' && element.type === 'button')).toBe(true)

    const panel = $('[role="tabpanel"]', q('tabs'))
    expect(referenced(tab('Profile'), 'aria-controls')).toEqual([panel])
    expect(referenced(panel, 'aria-labelledby')).toEqual([tab('Profile')])
    // Unselected tabs do not point at a panel that is not rendered.
    expect(tab('Billing').hasAttribute('aria-controls')).toBe(false)
    expect(q('tab-content').textContent).toBe('Profile content')
    // The decorative tab icon is hidden from assistive technology.
    expect($('svg', tab('Profile')).getAttribute('aria-hidden')).toBe('true')
  })

  it('keeps one tab stop and lets Tab continue into the panel', async () => {
    setup({ tab: 'billing' })
    expect(tabsOf().map((element) => element.tabIndex)).toEqual([-1, 0, -1, -1])
    q('before').focus()
    await press('{Tab}')
    expect(document.activeElement).toBe(tab('Billing'))
    await press('{Tab}')
    expect(document.activeElement).toBe($('[role="tabpanel"]', q('tabs')))
  })

  it('selects on arrow keys (automatic activation), skips disabled tabs and wraps', async () => {
    const { state } = setup()
    tab('Profile').focus()
    await press('{ArrowRight}')
    expect(document.activeElement).toBe(tab('Billing'))
    expect(state.tab).toBe('billing')
    expect(q('tab-content').textContent).toBe('Billing content')

    await press('{ArrowRight}') // "Team" is disabled
    expect(document.activeElement).toBe(tab('Security'))
    expect(state.tab).toBe('security')

    await press('{ArrowRight}') // wraps
    expect(state.tab).toBe('profile')
    await press('{ArrowLeft}')
    expect(state.tab).toBe('security')

    await press('{Home}')
    expect(state.tab).toBe('profile')
    await press('{End}')
    expect(state.tab).toBe('security')

    // Vertical arrows are not tab navigation in a horizontal tablist.
    await press('{ArrowDown}')
    expect(state.tab).toBe('security')
    expect(selectedTab()).toBe('Security')
  })

  it('manual activation moves focus without selecting until Enter or Space', async () => {
    const { state } = setup({ activation: 'manual' })
    tab('Profile').focus()
    await press('{ArrowRight}')
    expect(document.activeElement).toBe(tab('Billing'))
    expect(state.tab).toBe('profile')
    await press('{Enter}')
    expect(state.tab).toBe('billing')
    await press('{End}')
    expect(state.tab).toBe('billing')
    await press(' ')
    expect(state.tab).toBe('security')
  })

  it('uses vertical arrows in a vertical tablist', async () => {
    const { state } = setup({ orientation: 'vertical' })
    expect($('[role="tablist"]', q('tabs')).getAttribute('aria-orientation')).toBe('vertical')
    tab('Profile').focus()
    await press('{ArrowRight}')
    expect(state.tab).toBe('profile')
    await press('{ArrowDown}')
    expect(state.tab).toBe('billing')
    await press('{ArrowUp}')
    expect(state.tab).toBe('profile')
    // The list and the panel sit side by side.
    const list = $('[role="tablist"]', q('tabs')).getBoundingClientRect()
    const panel = $('[role="tabpanel"]', q('tabs')).getBoundingClientRect()
    expect(panel.left).toBeGreaterThanOrEqual(list.right)
  })

  it('follows the writing direction: ArrowLeft goes to the next tab in RTL', async () => {
    const { state } = setup({}, { dir: 'rtl' })
    tab('Profile').focus()
    await press('{ArrowLeft}')
    expect(state.tab).toBe('billing')
    await press('{ArrowRight}')
    expect(state.tab).toBe('profile')
    // Visual order is mirrored as well.
    expect(tab('Profile').getBoundingClientRect().left).toBeGreaterThan(
      tab('Billing').getBoundingClientRect().left,
    )
  })

  it('selects on click, ignores the disabled tab and follows the model', async () => {
    const { state } = setup()
    await userEvent.click(tab('Security'))
    expect(state.tab).toBe('security')
    expect(tab('Team').disabled).toBe(true)
    await userEvent.click(tab('Team'), { force: true })
    expect(state.tab).toBe('security')

    state.tab = 'billing'
    await nextTick()
    expect(selectedTab()).toBe('Billing')
    expect(q('tab-content').textContent).toBe('Billing content')

    // A value that matches no tab: no panel, and the first enabled tab keeps the tab stop.
    state.tab = 'missing'
    await nextTick()
    expect(q('tabs').querySelector('[role="tabpanel"]')).toBeNull()
    expect(tabsOf().map((element) => element.tabIndex)).toEqual([0, -1, -1, -1])
  })
})

const items = (): HTMLDetailsElement[] => all<HTMLDetailsElement>('.sora-accordion__item', q('accordion'))
const triggers = (): HTMLElement[] => all('.sora-accordion__trigger', q('accordion'))
const trigger = (index: number): HTMLElement => {
  const found = triggers()[index]
  if (!found) throw new Error(`no accordion summary ${index}`)
  return found
}
const openStates = (): boolean[] => items().map((element) => element.open)
/** The native `toggle` event is queued as a task: wait for it before reading the model. */
const toggled = (): Promise<void> => flush()

describe('SoraAccordion', () => {
  it('is built from native details and summary elements', () => {
    setup()
    expect(items()).toHaveLength(4)
    for (const element of items()) {
      expect(element.tagName).toBe('DETAILS')
      expect(element.firstElementChild?.tagName).toBe('SUMMARY')
    }
    expect(openStates()).toEqual([true, false, false, false])
    expect(q('panel-q1').textContent).toBe('Everything in the catalogue.')
    // Single mode: one shared name makes the browser keep at most one item open.
    const names = new Set(items().map((element) => element.name))
    expect(names.size).toBe(1)
    expect([...names][0]).not.toBe('')
    // The decorative chevron is hidden from assistive technology.
    expect($('svg', trigger(0)).getAttribute('aria-hidden')).toBe('true')
  })

  it('single mode opens one panel at a time and can collapse it', async () => {
    const { state } = setup()
    await userEvent.click(trigger(1))
    await toggled()
    expect(state.open).toEqual(['q2'])
    expect(openStates()).toEqual([false, true, false, false])
    await userEvent.click(trigger(1))
    await toggled()
    expect(state.open).toEqual([])

    state.collapsible = false
    state.open = ['q4']
    await toggled()
    await userEvent.click(trigger(3))
    await toggled()
    expect(state.open).toEqual(['q4'])
    expect(items()[3]?.open).toBe(true)
  })

  it('multiple mode keeps several panels open', async () => {
    const { state } = setup({ multiple: true })
    expect(items().every((element) => element.name === '')).toBe(true)
    await userEvent.click(trigger(1))
    await userEvent.click(trigger(3))
    await toggled()
    expect(state.open).toEqual(['q1', 'q2', 'q4'])
    await userEvent.click(trigger(0))
    await toggled()
    expect(state.open).toEqual(['q2', 'q4'])
  })

  it('closed panels are out of reach; open ones are reachable', async () => {
    const { state } = setup()
    expect(q('panel-link').checkVisibility()).toBe(false)
    q('panel-link').focus()
    expect(document.activeElement).not.toBe(q('panel-link'))

    state.open = ['q2']
    await toggled()
    expect(items()[1]?.open).toBe(true)
    trigger(1).focus()
    await press('{Tab}')
    expect(document.activeElement).toBe(q('panel-link'))
    expect(q('panel-q2').dataset['open']).toBe('true')
  })

  it('follows the open state of the elements, also when the page opens one', async () => {
    const { state } = setup()
    // What find-in-page does when it reveals a match in a closed item.
    const third = items()[3] as HTMLDetailsElement
    third.open = true
    await toggled()
    expect(state.open).toEqual(['q4'])
    // Exclusive: the browser closed the item that was open.
    expect(openStates()).toEqual([false, false, false, true])
  })

  it('toggles with Enter and Space and moves between summaries with arrows, Home and End', async () => {
    const { state } = setup({ open: [] })
    trigger(0).focus()
    await press('{Enter}')
    await toggled()
    expect(state.open).toEqual(['q1'])
    await press(' ')
    await toggled()
    expect(state.open).toEqual([])

    await press('{ArrowDown}')
    expect(document.activeElement).toBe(trigger(1))
    await press('{ArrowDown}') // the disabled item is skipped
    expect(document.activeElement).toBe(trigger(3))
    await press('{ArrowDown}') // wraps
    expect(document.activeElement).toBe(trigger(0))
    await press('{End}')
    expect(document.activeElement).toBe(trigger(3))
    await press('{ArrowUp}')
    expect(document.activeElement).toBe(trigger(1))
    await press('{Home}')
    expect(document.activeElement).toBe(trigger(0))
  })

  it('never toggles a disabled item, and keeps it out of the Tab order', async () => {
    const { state } = setup({ open: [] })
    const disabled = trigger(2)
    expect(disabled.getAttribute('aria-disabled')).toBe('true')
    expect(disabled.tabIndex).toBe(-1)
    await userEvent.click(disabled, { force: true })
    await toggled()
    expect(state.open).toEqual([])
    expect(items()[2]?.open).toBe(false)
  })
})

describe('SoraBreadcrumbs', () => {
  it('is a navigation landmark with an ordered list of links and a current page', () => {
    setup()
    const nav = q('breadcrumbs')
    expect(nav.tagName).toBe('NAV')
    expect(nav.getAttribute('aria-label')).toBe('Breadcrumb')
    expect($('ol', nav).children).toHaveLength(4)
    const links = all<HTMLAnchorElement>('a', nav)
    expect(links.map((link) => [link.textContent?.trim(), link.getAttribute('href')])).toEqual([
      ['Home', '#home'],
      ['Projects', '#projects'],
    ])
    // The last item is the current page, never a link, even though it has an href.
    const current = $('[aria-current="page"]', nav)
    expect(current.tagName).toBe('SPAN')
    expect(current.textContent?.trim()).toBe('Roadmap')
    // No menu semantics for ordinary site navigation.
    expect(nav.querySelector('[role="menu"], [role="menuitem"]')).toBeNull()
  })

  it('hides separators from assistive technology and mirrors them in RTL', () => {
    setup({ locale: 'ar' })
    const separators = all<SVGElement & HTMLElement>('.sora-breadcrumbs__separator', q('breadcrumbs'))
    expect(separators).toHaveLength(3)
    expect(separators.every((icon) => icon.getAttribute('aria-hidden') === 'true')).toBe(true)
    expect(getComputedStyle(separators[0] as Element).transform).toBe('none')
    const mirrored = $('.sora-breadcrumbs__separator', q('breadcrumbs-localized'))
    expect(getComputedStyle(mirrored).transform).toBe('matrix(-1, 0, 0, 1, 0, 0)')
  })

  it('accepts a custom label and item slot', () => {
    setup()
    const nav = q('breadcrumbs-custom')
    expect(nav.getAttribute('aria-label')).toBe('Folder path')
    expect($('a', nav).textContent?.trim()).toBe('[Home]')
    expect($('[aria-current="page"] [data-current]', nav).dataset['current']).toBe('true')
  })
})

const pageButtons = (testId = 'pagination'): HTMLButtonElement[] =>
  all<HTMLButtonElement>('.sora-pagination__page .sora-pagination__button', q(testId))
const pageLabels = (testId = 'pagination'): string[] =>
  all('.sora-pagination__page', q(testId)).map((item) => item.textContent?.trim() ?? '')
const arrow = (label: string, testId = 'pagination'): HTMLButtonElement =>
  $<HTMLButtonElement>(`button[aria-label="${label}"]`, q(testId))

describe('SoraPagination', () => {
  it('is a labelled navigation landmark with a current page', () => {
    setup()
    const nav = q('pagination')
    expect(nav.tagName).toBe('NAV')
    expect(nav.getAttribute('aria-label')).toBe('Pagination')
    expect(q('pagination-total').getAttribute('aria-label')).toBe('Results pages')
    expect(pageLabels()).toEqual(['1', '…', '4', '5', '6', '…', '10'])
    const current = $('[aria-current="page"]', nav)
    expect(current.textContent?.trim()).toBe('5')
    expect(current.getAttribute('aria-label')).toBe('Page 5, current page')
    expect(pageButtons().map((button) => button.getAttribute('aria-label'))).toEqual([
      'Page 1',
      'Page 4',
      'Page 5, current page',
      'Page 6',
      'Page 10',
    ])
    // Gaps are decoration, not content.
    expect(all('.sora-pagination__gap', nav).every((gap) => gap.getAttribute('aria-hidden') === 'true')).toBe(
      true,
    )
  })

  it('never shows an ellipsis for a single hidden page', async () => {
    const { state } = setup({ page: 3 })
    expect(pageLabels()).toEqual(['1', '2', '3', '4', '…', '10'])
    state.page = 8
    await nextTick()
    expect(pageLabels()).toEqual(['1', '…', '7', '8', '9', '10'])
    state.pageCount = 3
    state.page = 2
    await nextTick()
    expect(pageLabels()).toEqual(['1', '2', '3'])
  })

  it('changes the page from the buttons and disables the ends', async () => {
    const { state } = setup({ page: 1 })
    expect(arrow('Previous page').disabled).toBe(true)
    expect(arrow('Next page').disabled).toBe(false)
    await userEvent.click(arrow('Next page'))
    expect(state.page).toBe(2)
    await userEvent.click($('button[aria-label="Page 10"]', q('pagination')))
    expect(state.page).toBe(10)
    expect(arrow('Next page').disabled).toBe(true)
    await userEvent.click(arrow('Previous page'))
    expect(state.page).toBe(9)

    state.paginationDisabled = true
    await nextTick()
    expect(all<HTMLButtonElement>('button', q('pagination')).every((button) => button.disabled)).toBe(true)
  })

  it('derives the page count from total and pageSize', () => {
    setup({ page: 10 })
    expect(pageLabels('pagination-total')).toEqual(['1', '…', '9', '10'])
    expect(arrow('Next page', 'pagination-total').disabled).toBe(true)
  })

  it('collapses to a "Page x of y" status when its container is narrow', async () => {
    const { state } = setup()
    const status = $('.sora-pagination__status', q('pagination'))
    expect(getComputedStyle(status).display).toBe('none')
    expect(getComputedStyle(pageButtons()[0] as Element).display).not.toBe('none')

    state.paginationWidth = '16rem'
    await flush()
    expect(getComputedStyle(status).display).toBe('block')
    expect(status.textContent?.trim()).toBe('Page 5 of 10')
    expect(getComputedStyle($('.sora-pagination__page', q('pagination'))).display).toBe('none')
    // Previous and next stay available, and nothing overflows the container.
    expect(arrow('Previous page').getBoundingClientRect().width).toBeGreaterThan(0)
    expect(q('pagination').scrollWidth).toBeLessThanOrEqual(q('pagination-box').clientWidth)
  })

  it('mirrors the arrows and formats numbers for the locale in RTL', async () => {
    const { state } = setup({ locale: 'ar' })
    const nav = q('pagination')
    expect(getComputedStyle(nav).direction).toBe('rtl')
    const five = new Intl.NumberFormat('ar').format(5)
    expect($('[aria-current="page"]', nav).textContent?.trim()).toBe(five)
    // Without a translator the names stay English (the built-in fallback), numbers are localised.
    expect($('[aria-current="page"]', nav).getAttribute('aria-label')).toBe(`Page ${five}, current page`)

    const previous = arrow('Previous page')
    const next = arrow('Next page')
    // "Previous" is on the inline-start side, which is the right-hand side in RTL...
    expect(previous.getBoundingClientRect().left).toBeGreaterThan(next.getBoundingClientRect().left)
    // ...and its chevron points right (the left chevron, mirrored).
    expect(getComputedStyle($('svg', previous)).transform).toBe('matrix(-1, 0, 0, 1, 0, 0)')
    expect(getComputedStyle($('svg', next)).transform).toBe('matrix(-1, 0, 0, 1, 0, 0)')

    await userEvent.click(next)
    expect(state.page).toBe(6)
  })
})
