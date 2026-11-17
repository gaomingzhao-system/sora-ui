// TEMPORARY diagnostic (see tests/e2e/firefox-crash-diagnostic.ts): the runner's tracing off.
import { flow, flowInOwnBrowser, onlyInFirefox, test } from '../firefox-crash-diagnostic.ts'

onlyInFirefox()
test.use({ trace: 'off' })

test('S1 runner page, tracing off', async ({ page }) => {
  await flow(page)
})

test('S4 own browser, tracing off', async () => {
  await flowInOwnBrowser()
})
