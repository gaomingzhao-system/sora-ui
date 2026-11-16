import { componentCategories, componentManifest } from '../../../packages/ui/src/components.manifest.ts'
import { expect, openGallery, test } from '../support.ts'

test('every component of the catalogue has a live demo', async ({ page }) => {
  await openGallery(page, 'components')
  const names = componentManifest.map((entry) => entry.name)
  expect(names).toHaveLength(44)

  const demos = await page.locator('[data-demo]').evaluateAll((nodes) =>
    nodes.map((node) => ({
      name: node.getAttribute('data-demo'),
      heading: node.querySelector('h3')?.textContent?.trim(),
      // The demo area is the last child of the section; it must render real elements.
      elements: node.lastElementChild?.querySelectorAll('*').length ?? 0,
    })),
  )
  expect(demos.map((demo) => demo.name).toSorted()).toEqual(names.toSorted())
  for (const demo of demos) {
    expect(demo.heading, `${demo.name} heading`).toBe(demo.name)
    expect(demo.elements, `${demo.name} renders a demo`).toBeGreaterThan(0)
  }
})

test('demos are grouped by category, in manifest order, with working in-page links', async ({ page }) => {
  await openGallery(page, 'components')
  const categories = await page
    .locator('[data-category]')
    .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-category')))
  expect(categories).toEqual([...componentCategories])

  for (const category of componentCategories) {
    const expected = componentManifest
      .filter((entry) => entry.category === category)
      .map((entry) => entry.name)
    const inSection = await page
      .locator(`[data-category="${category}"] [data-demo]`)
      .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-demo')))
    expect(inSection.toSorted(), category).toEqual(expected.toSorted())
  }

  // The link scrolls to the demo and does not disturb the hash route.
  await page.locator('[data-category="data"] a', { hasText: 'UiTable' }).click()
  await expect(page.locator('#demo-UiTable')).toBeInViewport()
  expect(new URL(page.url()).hash).toBe('#/components')
})

test('the overview states the size of the catalogue', async ({ page }) => {
  await openGallery(page, 'overview')
  await expect(page.getByTestId('component-count')).toContainText('44')
})

test('every demo keeps rendering in the pseudo-locale (long, accented text)', async ({ page }) => {
  await openGallery(page, 'components', { locale: 'en-XA' })
  await expect(page.locator('[data-demo]')).toHaveCount(44)
  // Pseudo-localised text is visibly different from English.
  await expect(page.locator('main h1')).not.toHaveText('Components')
})
