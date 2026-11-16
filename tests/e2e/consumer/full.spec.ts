import { origin } from '../ports.ts'
import { expect, expectNoAxeViolations, test } from '../support.ts'

/**
 * An application outside the workspace that installed the packed tarballs
 * and uses the core, a per-component subpath, the forms and i18n entries,
 * the theme helpers and precompiled locales, with the runtime message
 * compiler dropped. It has no Tailwind and no source aliases.
 */
test.beforeEach(async ({ page }) => {
  await page.goto(origin('full'))
  await expect(page.getByTestId('title')).toHaveText('Packed consumer')
})

test('core components and a per-component subpath import work together', async ({ page }) => {
  const button = page.getByTestId('consumer-button')
  await expect(button).toHaveText('Clicked 0')
  await expect(button).toHaveAttribute('name', 'counter')
  await button.click()
  await button.click()
  await expect(button).toHaveText('Clicked 2')
  // UiBadge comes from '@your-scope/ui/components/UiBadge'.
  await expect(page.getByTestId('consumer-badge')).toHaveText('2')
  await expect(page.getByTestId('consumer-badge')).toHaveClass(/vui-badge/)
})

test('an unlayered application rule overrides the library without !important', async ({ page }) => {
  const width = await page
    .getByTestId('consumer-button')
    .evaluate((node) => node.getBoundingClientRect().width)
  // app.css: `.vui-button.app-wide { min-inline-size: 12rem }`
  expect(width).toBeGreaterThanOrEqual(192)
})

test('locales load on demand as precompiled messages and switch the document direction', async ({ page }) => {
  const html = page.locator('html')
  const pagination = page.getByRole('navigation')
  await expect(pagination).toHaveAttribute('aria-label', 'Pagination')

  const chunk = page.waitForResponse((response) => /\/assets\/ja-.*\.js$/.test(response.url()))
  await page.getByTestId('locale-ja').click()
  expect((await chunk).ok()).toBe(true)
  await expect(page.getByTestId('title')).toHaveText('パック済みコンシューマー')
  await expect(html).toHaveAttribute('lang', 'ja')
  // A library message with a placeholder, compiled at build time (the runtime compiler is not in this bundle).
  await expect(pagination).toHaveAttribute('aria-label', 'ページネーション')
  await expect(pagination.locator('[aria-current="page"]')).toHaveAttribute(
    'aria-label',
    '2 ページ、現在のページ',
  )

  await page.getByTestId('locale-ar').click()
  await expect(html).toHaveAttribute('dir', 'rtl')
  await expect(page.getByTestId('title')).toHaveText('مستهلك الحزمة')

  await page.getByTestId('locale-en').click()
  await expect(html).toHaveAttribute('dir', 'ltr')
  await expect(pagination).toHaveAttribute('aria-label', 'Pagination')
})

test('the forms entry validates, awaits the submit callback and reports the output', async ({ page }) => {
  const email = page.getByTestId('consumer-email')
  const submit = page.getByTestId('consumer-submit')
  await submit.click()
  await expect(email).toBeFocused()
  await expect(email).toHaveAttribute('aria-invalid', 'true')
  await expect(page.getByRole('group', { name: 'There is a problem' }).getByRole('link')).toHaveText([
    'Email: required',
  ])

  await email.fill('nope')
  await expect(email).toHaveAccessibleDescription('invalid')
  await email.fill('ada@example.com')
  await expect(email).not.toHaveAttribute('aria-invalid', 'true')

  await submit.click()
  await expect(submit).toHaveAttribute('aria-busy', 'true')
  await expect(page.getByTestId('consumer-saved')).toHaveText('ada@example.com')
  await expect(submit).not.toHaveAttribute('aria-busy', 'true')
})

test('a nested provider themes its subtree from createProviderTheme()', async ({ page }) => {
  const primary = (testId: string): Promise<string> =>
    page.getByTestId(testId).evaluate((node) => getComputedStyle(node).backgroundColor)
  expect(await primary('consumer-open')).not.toBe(await primary('consumer-button'))
  await expect(page.getByTestId('consumer-accent')).toHaveAttribute('style', /--vui-primary/)
})

test('a native modal dialog opens, traps the page behind it and restores focus', async ({ page }) => {
  await page.getByTestId('consumer-open').click()
  const dialog = page.getByTestId('consumer-dialog')
  await expect(dialog).toBeVisible()
  expect(await dialog.evaluate((node) => node.matches(':modal'))).toBe(true)
  await expect(page.getByTestId('consumer-dialog-body')).toHaveText('2')
  await page.getByTestId('consumer-close').click()
  await expect(dialog).toBeHidden()
  await expect(page.getByTestId('consumer-open')).toBeFocused()
})

test('passes axe in light and dark', async ({ page }) => {
  await expectNoAxeViolations(page)
  await page.emulateMedia({ colorScheme: 'dark' })
  await expectNoAxeViolations(page)
})
