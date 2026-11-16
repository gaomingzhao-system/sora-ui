import { AxeBuilder } from '@axe-core/playwright'
import { expect, test as base } from '@playwright/test'
import type { Page } from '@playwright/test'

export { expect }

export const PAGES = ['overview', 'foundations', 'components', 'forms', 'accessibility'] as const
export type GalleryPage = (typeof PAGES)[number]

export interface GalleryOptions {
  theme?: 'light' | 'dark' | 'system'
  locale?: 'en' | 'ja' | 'ar' | 'en-XA'
  density?: 'compact' | 'comfortable'
}

/**
 * Every test fails on console errors and warnings, uncaught page errors and
 * failed or 4xx/5xx requests, whatever else it asserts.
 */
export const test = base.extend<{ problems: string[] }>({
  problems: [
    async ({ page }, use) => {
      const problems: string[] = []
      page.on('console', (message) => {
        if (message.type() === 'error' || message.type() === 'warning') {
          problems.push(`console.${message.type()}: ${message.text()}`)
        }
      })
      page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`))
      page.on('requestfailed', (request) => problems.push(`request failed: ${request.url()}`))
      page.on('response', (response) => {
        if (response.status() >= 400) problems.push(`HTTP ${response.status()}: ${response.url()}`)
      })
      await use(problems)
      expect(problems, 'console errors/warnings, page errors and failed requests').toEqual([])
    },
    { auto: true },
  ],
})

/** Open a gallery page with a given display configuration and wait until it has rendered. */
export async function openGallery(
  page: Page,
  name: GalleryPage,
  options: GalleryOptions = {},
): Promise<void> {
  const query = new URLSearchParams()
  if (options.theme) query.set('theme', options.theme)
  if (options.locale) query.set('locale', options.locale)
  if (options.density) query.set('density', options.density)
  const search = query.size > 0 ? `?${query}` : ''
  await page.goto(`/${search}#/${name}`)
  await expect(page.locator('main h1')).toBeVisible()
  if (options.locale && options.locale !== 'en') {
    // Locale chunks load lazily; wait for the document language to follow.
    await expect(page.locator('html')).toHaveAttribute('lang', options.locale)
  }
  await page.evaluate(() => document.fonts.ready)
}

/**
 * Automated WCAG 2.2 A/AA checks plus axe's best practices. Automated rules
 * cover only part of WCAG; docs/accessibility.md lists what was checked by hand.
 */
export async function expectNoAxeViolations(page: Page, options: { include?: string } = {}): Promise<void> {
  let builder = new AxeBuilder({ page }).withTags([
    'wcag2a',
    'wcag2aa',
    'wcag21a',
    'wcag21aa',
    'wcag22aa',
    'best-practice',
  ])
  if (options.include) builder = builder.include(options.include)
  const results = await builder.analyze()
  const violations = results.violations.map((violation) => ({
    rule: violation.id,
    impact: violation.impact,
    help: violation.help,
    nodes: violation.nodes
      .slice(0, 5)
      .map((node) => `${node.target.join(' ')} :: ${node.failureSummary ?? ''}`),
  }))
  expect(violations).toEqual([])
}

/** True when the page (not an inner scroll region) can scroll sideways. */
export function hasHorizontalScroll(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const root = document.documentElement
    return root.scrollWidth > root.clientWidth + 1
  })
}
