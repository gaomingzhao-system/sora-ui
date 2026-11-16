import { existsSync } from 'node:fs'
import { defineConfig, devices } from '@playwright/test'
import { PORTS, origin } from './tests/e2e/ports.ts'

/**
 * End-to-end tests run against *built* output only:
 *
 *   gallery   apps/gallery/dist                      (`pnpm build`)
 *   consumer  .artifacts/consumers/{basic,full}/dist (`pnpm verify:consumer`:
 *             applications that installed the packed tarballs)
 *
 * VUI_E2E_BROWSERS  comma-separated list of chromium, firefox, webkit
 *                   (default: all three, as in CI)
 * VUI_CHROMIUM_PATH use an existing Chromium binary instead of the one
 *                   `playwright install` downloads
 */
const requested = (process.env['VUI_E2E_BROWSERS'] ?? 'chromium,firefox,webkit')
  .split(',')
  .map((name) => name.trim())
  .filter(Boolean)
const chromiumPath = process.env['VUI_CHROMIUM_PATH']
const chromium = {
  ...devices['Desktop Chrome'],
  launchOptions: chromiumPath ? { executablePath: chromiumPath } : {},
}
const browsers = {
  chromium,
  firefox: devices['Desktop Firefox'],
  webkit: devices['Desktop Safari'],
}

const consumers = {
  basic: '.artifacts/consumers/basic/dist',
  full: '.artifacts/consumers/full/dist',
}
const hasConsumers = Object.values(consumers).every((directory) => existsSync(`${directory}/index.html`))
if (!hasConsumers && !process.env['VUI_E2E_QUIET']) {
  console.warn(
    'playwright: the packed consumers are not built; `pnpm verify:consumer` builds and tests them.',
  )
}

const server = (directory: string, name: keyof typeof PORTS) => ({
  command: `node scripts/serve-static.ts ${directory} ${PORTS[name]}`,
  url: origin(name),
  reuseExistingServer: !process.env['CI'],
  stdout: 'ignore' as const,
})

export default defineConfig({
  testDir: 'tests/e2e',
  outputDir: '.artifacts/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env['CI']),
  retries: process.env['CI'] ? 1 : 0,
  reporter: process.env['CI']
    ? [['github'], ['html', { outputFolder: '.artifacts/e2e-report', open: 'never' }]]
    : [['list']],
  expect: {
    // Opt-in visual checks (tests/e2e/gallery/visual.spec.ts): baselines are per platform and not committed.
    toHaveScreenshot: { maxDiffPixelRatio: 0.01, animations: 'disabled' },
  },
  snapshotPathTemplate: '.artifacts/e2e-snapshots/{projectName}/{testFilePath}/{arg}{ext}',
  use: {
    trace: process.env['CI'] ? 'retain-on-failure' : 'off',
    screenshot: 'only-on-failure',
  },
  projects: [
    ...requested.map((name) => {
      const device = browsers[name as keyof typeof browsers]
      if (!device) throw new Error(`VUI_E2E_BROWSERS: unknown browser "${name}"`)
      return { name, testDir: 'tests/e2e/gallery', use: { ...device, baseURL: origin('gallery') } }
    }),
    // Packaging is not a cross-browser question: one engine is enough here.
    ...(hasConsumers ? [{ name: 'consumer', testDir: 'tests/e2e/consumer', use: chromium }] : []),
  ],
  webServer: [
    server('apps/gallery/dist', 'gallery'),
    ...(hasConsumers ? [server(consumers.basic, 'basic'), server(consumers.full, 'full')] : []),
  ],
})
