import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { playwright } from '@vitest/browser-playwright'
import { defineConfig } from 'vitest/config'
import { workspaceAliases } from './scripts/workspace-aliases.ts'

const root = fileURLToPath(new URL('.', import.meta.url))

/**
 * In containers that ship their own Chromium build (instead of the one
 * `playwright install` downloads) point VUI_CHROMIUM_PATH at the binary.
 */
const chromiumPath = process.env['VUI_CHROMIUM_PATH']

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
        plugins: [vue({ features: { vapor: true } })],
        resolve: {
          alias: workspaceAliases(root),
          dedupe: ['vue'],
        },
        define: {
          __VUE_OPTIONS_API__: 'false',
          __VUE_PROD_DEVTOOLS__: 'false',
          __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false',
        },
        test: {
          name: 'browser',
          include: ['tests/browser/**/*.test.ts'],
          setupFiles: ['tests/browser/setup.ts'],
          browser: {
            enabled: true,
            headless: true,
            screenshotFailures: false,
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
