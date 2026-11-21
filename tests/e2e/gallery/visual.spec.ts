import { expect, openGallery, test } from '../support.ts'

/**
 * Opt-in visual checks: `SORA_VISUAL=1 pnpm test:e2e`.
 *
 * Screenshots depend on the operating system's font rendering, so baselines
 * are not committed. The first run on a machine records them under
 * .artifacts/e2e-snapshots; later runs on the same machine compare against
 * them (use `--update-snapshots` after an intended change).
 */
test.skip(!process.env['SORA_VISUAL'], 'visual checks are opt-in: set SORA_VISUAL=1')

for (const theme of ['light', 'dark'] as const) {
  test(`component states (${theme})`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await openGallery(page, 'components', { theme })
    await expect(page.getByTestId('component-states')).toHaveScreenshot(`states-${theme}.png`)
  })

  test(`settings panel (${theme})`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await openGallery(page, 'overview', { theme })
    await expect(page.getByTestId('settings-panel')).toHaveScreenshot(`settings-${theme}.png`)
  })
}

test('dialog', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await openGallery(page, 'components', { theme: 'light' })
  await page.getByTestId('dialog-open').click()
  await expect(page.getByRole('dialog', { name: 'Settings' })).toHaveScreenshot('dialog.png')
})
