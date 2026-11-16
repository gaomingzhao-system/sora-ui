import { origin } from '../ports.ts'
import { expect, expectNoAxeViolations, test } from '../support.ts'

/**
 * An application that installed the packed tarballs and imports only
 * SoraButton, SoraCard and the stylesheet. No Tailwind, no forms, no i18n.
 */
test.beforeEach(async ({ page }) => {
  await page.goto(origin('basic'))
  await expect(page.getByTestId('basic-card')).toBeVisible()
})

test('renders and reacts as a Vapor application', async ({ page }) => {
  await expect(page.getByTestId('basic-count')).toHaveText('0')
  await page.getByTestId('basic-button').click()
  await page.getByTestId('basic-button').click()
  await expect(page.getByTestId('basic-count')).toHaveText('2')
  await expect(page.getByRole('heading', { name: 'Basic' })).toBeVisible()
})

test('the one documented stylesheet import styles the components without Tailwind', async ({ page }) => {
  const button = page.getByTestId('basic-button')
  const style = await button.evaluate((node) => {
    const computed = getComputedStyle(node)
    return {
      background: computed.backgroundColor,
      radius: Number.parseFloat(computed.borderTopLeftRadius),
      height: node.getBoundingClientRect().height,
      cursor: computed.cursor,
      primary: computed.getPropertyValue('--sora-primary').trim(),
    }
  })
  expect(style.background).not.toBe('rgba(0, 0, 0, 0)')
  expect(style.radius).toBeGreaterThan(0)
  expect(style.height).toBeGreaterThanOrEqual(32)
  expect(style.primary).not.toBe('')

  const card = await page.getByTestId('basic-card').evaluate((node) => {
    const computed = getComputedStyle(node)
    return {
      border: Number.parseFloat(computed.borderTopWidth),
      radius: Number.parseFloat(computed.borderTopLeftRadius),
    }
  })
  expect(card.border).toBeGreaterThan(0)
  expect(card.radius).toBeGreaterThan(0)
})

test('the stylesheet does not reset the host page (no Preflight)', async ({ page }) => {
  // This application has no CSS of its own, so these are the browser defaults.
  const host = await page.evaluate(() => {
    const probe = document.createElement('h1')
    probe.textContent = 'host heading'
    const list = document.createElement('ul')
    list.innerHTML = '<li>item</li>'
    document.body.append(probe, list)
    const result = {
      bodyMargin: getComputedStyle(document.body).marginTop,
      headingWeight: getComputedStyle(probe).fontWeight,
      headingSize: Number.parseFloat(getComputedStyle(probe).fontSize),
      listStyle: getComputedStyle(list).listStyleType,
      listPadding: Number.parseFloat(getComputedStyle(list).paddingInlineStart),
    }
    probe.remove()
    list.remove()
    return result
  })
  expect(host.bodyMargin).toBe('8px')
  expect(Number(host.headingWeight)).toBeGreaterThanOrEqual(700)
  expect(host.headingSize).toBeGreaterThan(16)
  expect(host.listStyle).toBe('disc')
  expect(host.listPadding).toBeGreaterThan(0)
})

test('follows the operating system colour scheme by default', async ({ page }) => {
  const surface = (): Promise<string> =>
    page.getByTestId('basic-card').evaluate((node) => getComputedStyle(node).backgroundColor)
  await page.emulateMedia({ colorScheme: 'light' })
  const light = await surface()
  await page.emulateMedia({ colorScheme: 'dark' })
  // The library never forces a scheme: without `color-scheme` on the host page it stays light.
  expect(await surface()).toBe(light)
  await page.evaluate(() => {
    document.documentElement.style.colorScheme = 'light dark'
  })
  expect(await surface()).not.toBe(light)
})

test('passes axe', async ({ page }) => {
  // The fixture is deliberately bare (no landmarks or <h1>), so only the WCAG rules for the components apply.
  await expectNoAxeViolations(page, { include: '[data-testid="basic-card"]' })
})
