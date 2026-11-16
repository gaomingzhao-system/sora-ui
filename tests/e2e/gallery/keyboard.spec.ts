import { expect, openGallery, test } from '../support.ts'

/**
 * Keyboard flows. Whether Tab stops on buttons and links is an operating
 * system setting in WebKit, so tests that depend on the Tab order of such
 * controls say so; everything else focuses its starting point explicitly.
 */
const tabOrderIsConfigurable = (browserName: string): boolean => browserName === 'webkit'

test('the skip link is the first stop and moves focus to the content', async ({ page, browserName }) => {
  test.skip(tabOrderIsConfigurable(browserName), 'Tab to links is an OS setting in WebKit')
  await openGallery(page, 'components')
  await page.keyboard.press('Tab')
  const skip = page.getByTestId('skip-link')
  await expect(skip).toBeFocused()
  await expect(skip).toBeInViewport()
  await page.keyboard.press('Enter')
  await expect(page.locator('main')).toBeFocused()
  // The hash route is untouched.
  expect(new URL(page.url()).hash).toBe('#/components')
})

test('dialog: opens on Enter, focuses the marked control, contains Tab, closes on Escape, restores focus', async ({
  page,
}) => {
  await openGallery(page, 'components')
  const opener = page.getByTestId('dialog-open')
  await opener.focus()
  await page.keyboard.press('Enter')
  const dialog = page.getByRole('dialog', { name: 'Settings' })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('textbox')).toBeFocused()

  // Focus never reaches the page behind the modal dialog.
  for (let index = 0; index < 8; index++) {
    await page.keyboard.press('Tab')
    const outside = await page.evaluate(() => {
      const active = document.activeElement
      return active !== null && active !== document.body && !active.closest('dialog')
    })
    expect(outside, `after ${index + 1} tabs`).toBe(false)
  }

  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(opener).toBeFocused()
})

test('alert dialog: focuses the safe action and ignores backdrop clicks', async ({ page }) => {
  await openGallery(page, 'components')
  await page.getByTestId('confirm-open').click()
  const dialog = page.getByRole('alertdialog', { name: 'Discard changes?' })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('button', { name: 'Keep editing' })).toBeFocused()
  await page.mouse.click(5, 5)
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: 'Discard' }).click()
  await expect(dialog).toBeHidden()
  await expect(page.getByTestId('confirm-open')).toBeFocused()
})

test('drawer: a modal dialog on the logical end edge, mirrored in right-to-left', async ({ page }) => {
  // No slide-in animation, so the resting position can be measured right away.
  await page.emulateMedia({ reducedMotion: 'reduce' })
  // The page reserves a scrollbar gutter (so locking scroll does not shift it);
  // a drawer sits against the content edge, at most a scrollbar away from the window edge.
  const gutter = 20
  await openGallery(page, 'components')
  await page.getByTestId('drawer-open').click()
  const drawer = page.getByRole('dialog', { name: 'Filters' })
  await expect(drawer).toBeVisible()
  const width = page.viewportSize()?.width ?? 0
  const box = await drawer.boundingBox()
  const end = (box?.x ?? 0) + (box?.width ?? 0)
  expect(end).toBeGreaterThanOrEqual(width - gutter)
  expect(end).toBeLessThanOrEqual(width)
  expect(box?.x).toBeGreaterThan(width / 2)
  await page.keyboard.press('Escape')
  await expect(drawer).toBeHidden()
  await expect(page.getByTestId('drawer-open')).toBeFocused()

  await openGallery(page, 'components', { locale: 'ar' })
  await page.getByTestId('drawer-open').click()
  const mirrored = page.getByRole('dialog').filter({ visible: true })
  await expect(mirrored).toBeVisible()
  const start = (await mirrored.boundingBox())?.x ?? -1
  expect(start).toBeGreaterThanOrEqual(0)
  expect(start).toBeLessThanOrEqual(gutter)
})

test('menu: arrows, Home/End, typeahead, Enter and Escape', async ({ page }) => {
  await openGallery(page, 'components')
  const trigger = page.getByTestId('menu-trigger')
  await trigger.focus()
  await expect(trigger).toHaveAttribute('aria-haspopup', 'menu')
  await page.keyboard.press('ArrowDown')
  const menu = page.getByRole('menu')
  await expect(menu).toBeVisible()
  await expect(trigger).toHaveAttribute('aria-expanded', 'true')
  await expect(menu.getByRole('menuitem', { name: 'Edit' })).toBeFocused()

  await page.keyboard.press('ArrowDown')
  await expect(menu.getByRole('menuitem', { name: 'Duplicate' })).toBeFocused()
  await page.keyboard.press('End')
  await expect(menu.getByRole('menuitem', { name: 'Delete' })).toBeFocused()
  await page.keyboard.press('Home')
  await expect(menu.getByRole('menuitem', { name: 'Edit' })).toBeFocused()
  await page.keyboard.press('a')
  await expect(menu.getByRole('menuitem', { name: 'Archive' })).toBeFocused()

  await page.keyboard.press('Escape')
  await expect(menu).toBeHidden()
  await expect(trigger).toBeFocused()

  // Enter on the trigger opens the menu; the next keys already act inside it.
  await page.keyboard.press('Enter')
  await page.keyboard.press('ArrowDown')
  await expect(menu.getByRole('menuitem', { name: 'Duplicate' })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(menu).toBeHidden()
  await expect(page.getByTestId('menu-result')).toHaveText('Selected: duplicate')
  await expect(trigger).toBeFocused()
})

test('popover: non-modal, closes on Escape and on an outside click', async ({ page }) => {
  await openGallery(page, 'components')
  const trigger = page.getByTestId('popover-trigger')
  await trigger.focus()
  await page.keyboard.press('Enter')
  const panel = page.getByRole('dialog', { name: 'Share this page' })
  await expect(panel).toBeVisible()
  await expect(trigger).toHaveAttribute('aria-expanded', 'true')
  await page.keyboard.press('Escape')
  await expect(panel).toBeHidden()
  await expect(trigger).toBeFocused()

  await trigger.click()
  await expect(panel).toBeVisible()
  await page.locator('main h1').click()
  await expect(panel).toBeHidden()
})

test('tooltip: appears on keyboard focus, describes its control and yields to Escape', async ({ page }) => {
  await openGallery(page, 'components')
  const trigger = page.getByTestId('tooltip-trigger')
  await trigger.focus()
  const tooltip = page.getByRole('tooltip').filter({ visible: true })
  await expect(tooltip).toHaveText('Copies the link to your clipboard')
  await expect(trigger).toHaveAccessibleDescription('Copies the link to your clipboard')
  await page.keyboard.press('Escape')
  await expect(tooltip).toBeHidden()
  await expect(trigger).toBeFocused()
})

test('combobox: type to filter, arrows to move, Enter to select', async ({ page }) => {
  await openGallery(page, 'components')
  const input = page.getByTestId('combobox-local')
  await input.focus()
  await page.keyboard.type('an')
  const listbox = page.getByRole('listbox').filter({ visible: true })
  await expect(listbox).toBeVisible()
  await expect(input).toHaveAttribute('aria-expanded', 'true')
  const options = listbox.getByRole('option')
  expect(await options.count()).toBeGreaterThan(1)
  for (const text of await options.allTextContents()) expect(text.toLowerCase()).toContain('an')

  // DOM focus stays in the input; the active option is referenced.
  await page.keyboard.press('ArrowDown')
  await expect(input).toBeFocused()
  const active = await input.getAttribute('aria-activedescendant')
  expect(active).toBeTruthy()
  const chosen = await page.locator(`[id="${active}"]`).textContent()
  await page.keyboard.press('Enter')
  await expect(listbox).toBeHidden()
  await expect(input).toHaveValue(chosen?.trim() ?? '')
  await expect(page.getByTestId('combobox-value')).toHaveText(`Selected: ${chosen?.trim().toLowerCase()}`)
})

test('async combobox: announces loading, then offers the results', async ({ page }) => {
  await openGallery(page, 'components')
  const input = page.getByTestId('combobox-async')
  await input.focus()
  await page.keyboard.type('pe')
  // The pending request is announced through a polite status, then the result count is.
  const status = page.locator('#demo-SoraCombobox [role="status"]')
  await expect(status.filter({ hasText: 'Loading options' })).toHaveCount(1)
  const listbox = page.getByRole('listbox').filter({ visible: true })
  await expect(listbox.getByRole('option').first()).toBeVisible()
  await expect(status.filter({ hasText: /Results available: \d+/ })).toHaveCount(1)
  for (const text of await listbox.getByRole('option').allTextContents())
    expect(text.toLowerCase()).toContain('pe')
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('Enter')
  await expect(listbox).toBeHidden()
  await expect(input).not.toHaveValue('pe')
})

test('tabs follow the writing direction', async ({ page }) => {
  await openGallery(page, 'overview')
  const panel = page.getByTestId('settings-panel')
  const tabs = panel.getByRole('tab')
  await tabs.first().focus()
  await page.keyboard.press('ArrowRight')
  await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true')
  await expect(tabs.nth(1)).toBeFocused()
  await expect(panel.getByRole('switch').first()).toBeVisible()

  await openGallery(page, 'overview', { locale: 'ar' })
  const mirrored = page.getByTestId('settings-panel').getByRole('tab')
  await mirrored.first().focus()
  await page.keyboard.press('ArrowLeft')
  await expect(mirrored.nth(1)).toHaveAttribute('aria-selected', 'true')
})

test('overlays nested in a modal dialog: Escape peels one layer at a time', async ({ page }) => {
  await openGallery(page, 'accessibility')
  await page.getByTestId('nested-open').click()
  const dialog = page.getByTestId('nested-dialog')
  await expect(dialog).toBeVisible()

  const combobox = page.getByTestId('nested-combobox')
  await combobox.focus()
  await page.keyboard.press('ArrowDown')
  const listbox = page.getByRole('listbox').filter({ visible: true })
  await expect(listbox).toBeVisible()
  // The popup is in the top layer above the dialog and can be used with the pointer.
  await listbox.getByRole('option', { name: 'Cherry' }).click()
  await expect(combobox).toHaveValue('Cherry')

  await combobox.focus()
  await page.keyboard.press('ArrowDown')
  await expect(listbox).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(listbox).toBeHidden()
  await expect(dialog).toBeVisible()

  const menuTrigger = page.getByTestId('nested-menu')
  await menuTrigger.click()
  await expect(page.getByRole('menu')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('menu')).toBeHidden()
  await expect(dialog).toBeVisible()
  await expect(menuTrigger).toBeFocused()

  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(page.getByTestId('nested-open')).toBeFocused()
})

test('toasts are announced politely or assertively and can be dismissed', async ({ page }) => {
  await openGallery(page, 'components')
  await page.getByTestId('toast-show').click()
  const region = page.getByRole('region', { name: 'Notifications' })
  await expect(region.getByRole('status')).toContainText('Changes saved')
  await page.getByTestId('toast-urgent').click()
  await expect(region.getByRole('alert')).toContainText('Connection lost')
  await region.getByRole('button', { name: 'Dismiss notification' }).first().click()
  await expect(region.getByText('Changes saved')).toHaveCount(0)
  await expect(region.getByRole('alert')).toContainText('Connection lost')
})
