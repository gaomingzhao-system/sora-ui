import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// No aliases on purpose: the library must resolve through its published
// `exports` map exactly as it would for an external user. There is no
// Tailwind here either: the compiled stylesheet has to work on its own.
export default defineConfig({
  base: './',
  plugins: [vue({ features: { vapor: true, optionsAPI: false } })],
  define: {
    __VUE_OPTIONS_API__: 'false',
    __VUE_PROD_DEVTOOLS__: 'false',
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false',
    // The published locale modules are precompiled, so the message compiler can go.
    __VUE_I18N_LEGACY_API__: 'false',
    __VUE_I18N_FULL_INSTALL__: 'false',
    __INTLIFY_PROD_DEVTOOLS__: 'false',
    __INTLIFY_DROP_MESSAGE_COMPILER__: 'true',
  },
  build: { target: 'esnext', sourcemap: false },
  preview: { port: 4174, strictPort: true },
})
