/**
 * TEMPORARY diagnostic, removed again once the cause is known.
 *
 * Firefox's content process crashes ("Page crashed") while axe scans the forms
 * page after an empty submission (forms.spec.ts). The page state alone does
 * not crash a separately launched Firefox, so these copies of the test each
 * leave out one of its steps: the settling wait, the assertions, the problem
 * listeners. Each copy passes or crashes on its own.
 */
import { AxeBuilder } from '@axe-core/playwright'
import { devices, test as base } from '@playwright/test'
import type { Page } from '@playwright/test'
import { origin } from '../ports.ts'
import { expect, openGallery, settled, test } from '../support.ts'

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']

test.describe.configure({ retries: 0 })
test.skip(({ browserName }) => browserName !== 'firefox', 'diagnoses a Firefox-only crash')

async function submitEmpty(page: Page, assertions: boolean): Promise<void> {
  await openGallery(page, 'forms')
  const form = page.getByTestId('profile-form')
  if (assertions) {
    await expect(form.locator('[aria-invalid="true"]')).toHaveCount(0)
    await expect(form.getByRole('group', { name: 'There is a problem' })).toHaveCount(0)
  }
  await form.getByTestId('profile-submit').click()
  const summary = form.getByRole('group', { name: 'There is a problem' })
  await expect(summary).toBeVisible()
  if (!assertions) return
  const name = form.getByRole('textbox', { name: 'Full name', exact: true })
  await expect(name).toBeFocused()
  await expect(name).toHaveAttribute('aria-invalid', 'true')
  await expect(name).toHaveAccessibleDescription('This field is required.')
  await expect(summary.getByRole('link')).toHaveText([
    'Full name: This field is required.',
    'Email: This field is required.',
    'Username: This field is required.',
    'Role: This field is required.',
    'I confirm this information is accurate: You must accept this to continue.',
  ])
  await expect(page.getByTestId('profile-output')).toHaveCount(0)
}

async function scan(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page }).withTags(TAGS).analyze()
  expect(results.violations.map((violation) => violation.id)).toEqual([])
}

test('T1 exact copy: assertions, settled(), axe', async ({ page }) => {
  await submitEmpty(page, true)
  await settled(page)
  await scan(page)
})

test('T2 no settled(): assertions, 600 ms, axe', async ({ page }) => {
  await submitEmpty(page, true)
  await page.waitForTimeout(600)
  await scan(page)
})

test('T3 no assertions: settled(), axe', async ({ page }) => {
  await submitEmpty(page, false)
  await settled(page)
  await scan(page)
})

test('T4 neither: 600 ms, axe', async ({ page }) => {
  await submitEmpty(page, false)
  await page.waitForTimeout(600)
  await scan(page)
})

test('T5 getAnimations() only, no finished: assertions, axe', async ({ page }) => {
  await submitEmpty(page, true)
  await page.evaluate(() => document.getAnimations().length)
  await page.waitForTimeout(600)
  await scan(page)
})

test('T6 settled() without holding Animation objects: assertions, axe', async ({ page }) => {
  await submitEmpty(page, true)
  await page.waitForFunction(() => {
    const finite = (animation: Animation): boolean =>
      Number.isFinite(animation.effect?.getComputedTiming().endTime ?? Number.NaN)
    return !document.getAnimations().some((animation) => finite(animation))
  })
  await scan(page)
})

base('T7 exact copy without the problem listeners', async ({ page }) => {
  await submitEmpty(page, true)
  await settled(page)
  await scan(page)
})

test('T8 exact copy in a context with reducedMotion: no-preference', async ({ browser }) => {
  const context = await browser.newContext({
    ...devices['Desktop Firefox'],
    baseURL: origin('gallery'),
    reducedMotion: 'no-preference',
  })
  const page = await context.newPage()
  try {
    await submitEmpty(page, true)
    await settled(page)
    await scan(page)
  } finally {
    await context.close()
  }
})

test('T9 exact copy with reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await submitEmpty(page, true)
  await settled(page)
  await scan(page)
})
