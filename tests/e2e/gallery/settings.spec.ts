import { expect, openGallery, test } from '../support.ts'

test('theme, language and density are switched from the settings popover', async ({ page }) => {
  await openGallery(page, 'overview', { theme: 'light' })
  const html = page.locator('html')
  await expect(html).toHaveAttribute('data-sora-theme', 'light')
  const lightCanvas = await page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor)

  await page.getByTestId('settings-trigger').click()
  await page.getByTestId('theme-dark').click()
  await expect(html).toHaveAttribute('data-sora-theme', 'dark')
  await expect(page.getByTestId('theme-dark')).toHaveAttribute('aria-pressed', 'true')
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme)).toBe('dark')
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor)).not.toBe(
    lightCanvas,
  )

  // Japanese is a separate chunk that is fetched on demand.
  const chunk = page.waitForResponse((response) => /\/assets\/ja-.*\.js$/.test(response.url()))
  await page.getByTestId('locale-select').selectOption('ja')
  expect((await chunk).ok()).toBe(true)
  await expect(html).toHaveAttribute('lang', 'ja')
  await expect(html).toHaveAttribute('dir', 'ltr')
  await expect(
    page.locator('header nav').getByRole('link', { name: 'コンポーネント', exact: true }),
  ).toBeVisible()

  await page.getByTestId('locale-select').selectOption('ar')
  await expect(html).toHaveAttribute('lang', 'ar')
  await expect(html).toHaveAttribute('dir', 'rtl')

  await page.getByTestId('density-select').selectOption('comfortable')
  await expect(html).toHaveAttribute('data-sora-density', 'comfortable')
})

test('the URL presets theme, language and density', async ({ page }) => {
  await openGallery(page, 'foundations', { theme: 'dark', locale: 'ar', density: 'comfortable' })
  const html = page.locator('html')
  await expect(html).toHaveAttribute('data-sora-theme', 'dark')
  await expect(html).toHaveAttribute('dir', 'rtl')
  await expect(html).toHaveAttribute('data-sora-density', 'comfortable')
  await expect(page.locator('nav [aria-current="page"]')).toHaveCount(1)
})

test('"system" follows the operating system colour scheme', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' })
  await openGallery(page, 'overview', { theme: 'system' })
  const dark = await page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor)
  await page.emulateMedia({ colorScheme: 'light' })
  const light = await page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor)
  expect(dark).not.toBe(light)
})

test('nested providers scope their theme without affecting the page', async ({ page }) => {
  await openGallery(page, 'foundations', { theme: 'light' })
  const scheme = (testId: string): Promise<string> =>
    page.getByTestId(testId).evaluate((node) => getComputedStyle(node).colorScheme)
  expect(await scheme('nested-dark')).toBe('dark')
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme)).toBe('light')
  // The sharp island turns radius and motion off through tokens.
  const sharp = page.getByTestId('nested-sharp').getByRole('button').first()
  expect(await sharp.evaluate((node) => getComputedStyle(node).borderTopLeftRadius)).toBe('0px')
  expect(
    await sharp.evaluate((node) =>
      Number.parseFloat(getComputedStyle(node).getPropertyValue('--sora-duration-fast')),
    ),
  ).toBe(0)
  await expect(page.getByTestId('contrast-count')).toContainText(/\d+/)
})
