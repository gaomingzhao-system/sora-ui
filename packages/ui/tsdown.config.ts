import { defineConfig } from 'tsdown'
import Vue from 'unplugin-vue/rolldown'
import { compiledMessagesPlugin } from '../../scripts/compiled-messages-plugin.ts'
import { componentManifest } from './src/components.manifest.ts'

const LOCALES = ['en', 'ja', 'ar', 'pseudo'] as const

/**
 * Entries
 *   index                 core barrel (no forms, no i18n library, English fallback only)
 *   components/<Name>     one entry per manifest component (default export)
 *   forms                 Formisch integration          (optional peers: @formisch/vue, valibot)
 *   i18n                  petite-vue-i18n adapter       (optional peer: petite-vue-i18n)
 *   i18n/locales/<x>      precompiled messages for the adapter
 *   locales/<x>           raw flat messages for any translator
 *   theme                 runtime theming helpers       (pulls in @your-scope/theme)
 */
export default defineConfig({
  entry: {
    index: './src/index.ts',
    forms: './src/forms/index.ts',
    i18n: './src/i18n/index.ts',
    theme: './src/theme/index.ts',
    ...Object.fromEntries(LOCALES.map((locale) => [`locales/${locale}`, `./src/locales/${locale}.ts`])),
    ...Object.fromEntries(
      LOCALES.map((locale) => [`i18n/locales/${locale}`, `./src/i18n/locales/${locale}.ts`]),
    ),
    ...Object.fromEntries(
      componentManifest.map((entry) => [`components/${entry.name}`, `./src/${entry.source}`]),
    ),
  },
  format: ['esm'],
  platform: 'browser',
  target: 'esnext',
  sourcemap: true,
  clean: true,
  plugins: [
    // Published locale artifacts are precompiled here, not only in the gallery.
    compiledMessagesPlugin(),
    Vue({
      isProduction: true,
      // Every SFC carries the `vapor` marker; this makes the build fail closed if one does not.
      features: { vapor: true, optionsAPI: false },
    }),
  ],
  deps: {
    // One Vue runtime, and no optional peer or workspace package inlined.
    neverBundle: [
      /^vue(?:\/|$)/,
      /^@vue\//,
      '@formisch/vue',
      'valibot',
      'petite-vue-i18n',
      /^@intlify\//,
      '@your-scope/theme',
    ],
  },
  dts: {
    // The classic compiler-API generator (backed by the TypeScript 7 bridge) is
    // the only one that understands Vue SFCs through Volar.
    generator: 'tsc',
    tsc: { vue: true },
  },
})
