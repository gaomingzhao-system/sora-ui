// TEMPORARY diagnostic (see tests/e2e/firefox-crash-diagnostic.ts): the runner's tracing as in CI.
import { flow, flowInOwnBrowser, onlyInFirefox, test } from '../firefox-crash-diagnostic.ts'

onlyInFirefox()

test('S0 runner page, tracing on, expect waits', async ({ page }) => {
  await flow(page, 'expect')
})

test('S2 runner page, tracing on, waitFor waits', async ({ page }) => {
  await flow(page, 'waitFor')
})

test('S3 own browser, tracing on', async () => {
  await flowInOwnBrowser()
})
