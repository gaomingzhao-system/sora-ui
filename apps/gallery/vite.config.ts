import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { compiledMessagesPlugin } from '../../scripts/compiled-messages-plugin.ts'
import { workspaceAliases } from '../../scripts/workspace-aliases.ts'

const root = fileURLToPath(new URL('../..', import.meta.url))

export default defineConfig({
  // Relative asset URLs so the built gallery can be served from any sub-path.
  base: './',
  plugins: [
    // `?compiled` imports: library and gallery messages are precompiled, so the
    // runtime message compiler can be dropped below.
    compiledMessagesPlugin(),
    // Every SFC already carries the `vapor` marker; `features.vapor` enforces
    // it, so an unmarked file can never fall back to the VDOM compiler.
    vue({ features: { vapor: true, optionsAPI: false } }),
    tailwindcss(),
  ],
  resolve: {
    // The gallery runs against the workspace sources for fast feedback. The
    // packed tarballs are exercised by apps/consumer (pnpm verify:consumer).
    alias: workspaceAliases(root),
    dedupe: ['vue'],
  },
  define: {
    __VUE_OPTIONS_API__: 'false',
    __VUE_PROD_DEVTOOLS__: 'false',
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false',
    // petite-vue-i18n: Composition API only, no devtools hook, and no runtime
    // message compiler (every dictionary is precompiled).
    __VUE_I18N_LEGACY_API__: 'false',
    __VUE_I18N_FULL_INSTALL__: 'false',
    __INTLIFY_PROD_DEVTOOLS__: 'false',
    __INTLIFY_DROP_MESSAGE_COMPILER__: 'true',
  },
  build: {
    target: 'esnext',
    sourcemap: true,
  },
  server: { port: 5173, strictPort: false },
  preview: { port: 4173, strictPort: true },
})
