/**
 * TEMPORARY diagnostic, removed again once the cause is confirmed.
 *
 * Firefox's content process crashed while axe scanned the forms page after an
 * empty submission, but only when the test had waited for the error summary
 * with expect(): every copy that waited with locator.waitFor() passed. While
 * expect() retries on an element that does not exist yet, Playwright renders
 * an aria snapshot of the whole page. These copies wait with waitFor() and
 * take that snapshot themselves: during the validation, or once afterwards.
 */
import { AxeBuilder } from '@axe-core/playwright'
import type { Page } from '@playwright/test'
import { expect, openGallery, test } from '../support.ts'

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']

test.describe.configure({ retries: 0 })
test.skip(({ browserName }) => browserName !== 'firefox', 'diagnoses a Firefox-only crash')

async function scan(page: Page): Promise<void> {
  await page.waitForTimeout(600)
  const results = await new AxeBuilder({ page }).withTags(TAGS).analyze()
  expect(results.violations.map((violation) => violation.id)).toEqual([])
}

test('M1 aria snapshots of the page while the validation runs, then axe', async ({ page }) => {
  await openGallery(page, 'forms')
  const form = page.getByTestId('profile-form')
  const summary = form.getByRole('group', { name: 'There is a problem' })
  await form.getByTestId('profile-submit').click()
  let snapshots = 0
  while (!(await summary.isVisible()) && snapshots < 50) {
    await page.locator('body').ariaSnapshot()
    snapshots++
  }
  test.info().annotations.push({ type: 'snapshots', description: String(snapshots) })
  await summary.waitFor()
  await scan(page)
})

test('M2 one aria snapshot of the page after the summary appeared, then axe', async ({ page }) => {
  await openGallery(page, 'forms')
  const form = page.getByTestId('profile-form')
  await form.getByTestId('profile-submit').click()
  await form.getByRole('group', { name: 'There is a problem' }).waitFor()
  await page.locator('body').ariaSnapshot()
  await scan(page)
})
