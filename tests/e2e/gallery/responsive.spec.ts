import { PAGES, expect, hasHorizontalScroll, openGallery, test } from '../support.ts'

const WIDTHS = [320, 375, 390, 768, 1024, 1440] as const

for (const width of WIDTHS) {
  test(`no page scrolls sideways at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 })
    for (const name of PAGES) {
      await openGallery(page, name)
      expect(await hasHorizontalScroll(page), `${name} at ${width}px`).toBe(false)
    }
  })
}

for (const width of [320, 390] as const) {
  test(`right-to-left and long pseudo-localised text also fit ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 })
    for (const locale of ['ar', 'en-XA'] as const) {
      for (const name of PAGES) {
        await openGallery(page, name, { locale })
        expect(await hasHorizontalScroll(page), `${name} (${locale}) at ${width}px`).toBe(false)
      }
    }
  })
}

test('the workspace example adapts to its container, not the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await openGallery(page, 'overview')
  const workspace = page.getByTestId('workspace')
  const sidebar = workspace.locator('aside')
  const content = workspace.locator('aside + div')
  const filter = workspace.getByLabel('Status', { exact: true })

  // Wide container: sidebar beside the content, the duplicate filter select hidden.
  const wide = { sidebar: await sidebar.boundingBox(), content: await content.boundingBox() }
  expect(wide.content?.x).toBeGreaterThanOrEqual((wide.sidebar?.x ?? 0) + (wide.sidebar?.width ?? 0) - 1)
  await expect(filter).toBeHidden()

  // Narrow viewport: the same markup stacks and shows the filter select.
  await page.setViewportSize({ width: 390, height: 800 })
  const narrow = { sidebar: await sidebar.boundingBox(), content: await content.boundingBox() }
  expect(narrow.content?.y).toBeGreaterThanOrEqual(
    (narrow.sidebar?.y ?? 0) + (narrow.sidebar?.height ?? 0) - 1,
  )
  await expect(filter).toBeVisible()

  // The table keeps table semantics and scrolls inside its own labelled region.
  const region = workspace.getByRole('region', { name: 'Projects in this workspace' })
  await expect(region).toBeVisible()
  await expect(region.getByRole('columnheader').first()).toBeVisible()
  expect(await hasHorizontalScroll(page)).toBe(false)
})

test('pagination collapses to a status line in a narrow container', async ({ page }) => {
  await openGallery(page, 'components')
  const compact = page.getByRole('navigation', { name: 'Pagination, compact' })
  await compact.scrollIntoViewIfNeeded()
  await expect(compact.getByText('Page 1 of 12')).toBeVisible()
  await expect(compact.getByRole('button', { name: 'Page 2', exact: true })).toBeHidden()
  await expect(compact.getByRole('button', { name: 'Next page' })).toBeVisible()
})
