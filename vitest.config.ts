import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { playwright } from '@vitest/browser-playwright'
import { defineConfig } from 'vitest/config'
import type { BrowserCommand } from 'vitest/node'
import { compiledMessagesPlugin } from './scripts/compiled-messages-plugin.ts'
import { workspaceAliases } from './scripts/workspace-aliases.ts'

const root = fileURLToPath(new URL('.', import.meta.url))

/**
 * In containers that ship their own Chromium build (instead of the one
 * `playwright install` downloads) point SORA_CHROMIUM_PATH at the binary.
 */
const chromiumPath = process.env['SORA_CHROMIUM_PATH']

/**
 * Half a click each (at the current pointer position), so a test can observe
 * what happens between pointer down and pointer up. Typed in tests/browser/support.ts.
 */
const mouseDown: BrowserCommand<[]> = async ({ page }) => {
  await page.mouse.down()
}
const mouseUp: BrowserCommand<[]> = async ({ page }) => {
  await page.mouse.up()
}

export default defineConfig({
  test: {
    projects: [
      {
        // Pure utilities only. Node resolves `vue` to its CJS build, which has
        // no Vapor runtime, so nothing here may import a component.
        resolve: { alias: workspaceAliases(root) },
        test: {
          name: 'unit',
          environment: 'node',
          include: ['tests/unit/**/*.test.ts'],
        },
      },
      {
        // Components run in a real browser, against the workspace sources and
        // the real stylesheet. `resolve.conditions` is left at Vite's browser
        // defaults, so `vue` resolves to its bundler entry (the one that
        // re-exports the Vapor runtime); tests/browser/compat asserts this.
        plugins: [
          compiledMessagesPlugin(),
          vue({ features: { vapor: true, optionsAPI: false } }),
          tailwindcss(),
        ],
        resolve: {
          alias: workspaceAliases(root),
          dedupe: ['vue'],
        },
        define: {
          __VUE_OPTIONS_API__: 'false',
          __VUE_PROD_DEVTOOLS__: 'false',
          __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false',
        },
        optimizeDeps: {
          include: ['vue', '@formisch/vue', 'valibot', 'petite-vue-i18n'],
        },
        test: {
          name: 'browser',
          include: ['tests/browser/**/*.test.ts'],
          setupFiles: ['tests/browser/setup.ts'],
          browser: {
            enabled: true,
            headless: true,
            screenshotFailures: false,
            commands: { mouseDown, mouseUp },
            viewport: { width: 1024, height: 768 },
            provider: playwright({
              launchOptions: chromiumPath ? { executablePath: chromiumPath } : {},
            }),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
})
