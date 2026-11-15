import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// No aliases on purpose: the library must resolve through its published
// `exports` map exactly as it would for an external user.
export default defineConfig({
  plugins: [vue({ features: { vapor: true, optionsAPI: false } })],
  build: { target: 'esnext', sourcemap: false },
})
