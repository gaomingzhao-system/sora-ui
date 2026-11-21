import { PAGES, expect, expectNoAxeViolations, openGallery, test } from '../support.ts'

for (const theme of ['light', 'dark'] as const) {
  for (const name of PAGES) {
    test(`${name} has no axe violations (${theme})`, async ({ page }) => {
      await openGallery(page, name, { theme })
      await expectNoAxeViolations(page)
    })
  }
}

for (const name of PAGES) {
  test(`${name} has no axe violations in Arabic (right-to-left)`, async ({ page }) => {
    await openGallery(page, name, { locale: 'ar' })
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
    await expectNoAxeViolations(page)
  })
}

test('comfortable density and Japanese pass as well', async ({ page }) => {
  await openGallery(page, 'components', { locale: 'ja', density: 'comfortable', theme: 'dark' })
  await expectNoAxeViolations(page)
})
