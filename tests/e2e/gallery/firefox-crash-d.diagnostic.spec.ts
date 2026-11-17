// TEMPORARY diagnostic (see tests/e2e/firefox-crash-diagnostic.ts): tracing without DOM snapshots.
import { flow, onlyInFirefox, test } from '../firefox-crash-diagnostic.ts'

onlyInFirefox()
test.use({ trace: { mode: 'retain-on-failure', snapshots: false } })

test('S6 runner page, tracing without snapshots', async ({ page }) => {
  await flow(page)
})
