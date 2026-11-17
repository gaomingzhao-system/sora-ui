// TEMPORARY diagnostic (see tests/e2e/firefox-crash-diagnostic.ts): tracing without screenshots.
import { flow, onlyInFirefox, test } from '../firefox-crash-diagnostic.ts'

onlyInFirefox()
test.use({ trace: { mode: 'retain-on-failure', screenshots: false } })

test('S5 runner page, tracing without screenshots', async ({ page }) => {
  await flow(page)
})
