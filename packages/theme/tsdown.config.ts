import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: { index: './src/index.ts' },
  format: ['esm'],
  platform: 'neutral',
  target: 'esnext',
  sourcemap: true,
  clean: true,
  dts: { generator: 'tsc' },
})
