/**
 * TEMPORARY diagnostic, removed again once the cause is known.
 *
 * Firefox's content process crashes ("Page crashed") while axe scans the forms
 * page after an empty submission (forms.spec.ts). Earlier runs showed that
 * every copy of the test crashes with the runner's page (with or without the
 * settling wait, assertions or problem listeners), while the same steps in a
 * browser launched inside a test, with the runner's tracing off, never did.
 * The firefox-crash-*.diagnostic.spec.ts files separate the runner's tracing
 * (a worker option, hence one file per setting), its parts, the waiting style
 * and the browser instance.
 */
import { AxeBuilder } from '@axe-core/playwright'
import { devices, firefox } from '@playwright/test'
import type { Page } from '@playwright/test'
import { origin } from './ports.ts'
import { expect, openGallery, test } from './support.ts'

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']

export { test }

export function onlyInFirefox(): void {
  test.describe.configure({ retries: 0 })
  test.skip(({ browserName }) => browserName !== 'firefox', 'diagnoses a Firefox-only crash')
}

/** The smallest copy that crashed: submit, wait for the summary, wait 600 ms, scan. */
export async function flow(page: Page, wait: 'expect' | 'waitFor' = 'expect'): Promise<void> {
  if (wait === 'expect') {
    await openGallery(page, 'forms')
  } else {
    await page.goto('/#/forms')
    await page.locator('main h1').waitFor()
    await page.evaluate(() => document.fonts.ready)
  }
  const form = page.getByTestId('profile-form')
  await form.getByTestId('profile-submit').click()
  const summary = form.getByRole('group', { name: 'There is a problem' })
  if (wait === 'expect') await expect(summary).toBeVisible()
  else await summary.waitFor()
  await page.waitForTimeout(600)
  const results = await new AxeBuilder({ page }).withTags(TAGS).analyze()
  expect(results.violations.map((violation) => violation.id)).toEqual([])
}

/** The same steps in a Firefox launched inside the test (the runner's tracing still applies). */
export async function flowInOwnBrowser(): Promise<void> {
  const browser = await firefox.launch()
  try {
    const context = await browser.newContext({ ...devices['Desktop Firefox'], baseURL: origin('gallery') })
    await flow(await context.newPage())
  } finally {
    await browser.close()
  }
}
