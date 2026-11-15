/**
 * Writes the explicit `exports` map of @your-scope/ui from the component
 * manifest (no wildcard subpaths).
 *
 *   node scripts/sync-exports.ts          rewrite packages/ui/package.json
 *   node scripts/sync-exports.ts --check  fail if it is out of date (CI, check:package)
 */
import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { componentManifest } from '../packages/ui/src/components.manifest.ts'

export const LOCALES = ['en', 'ja', 'ar', 'pseudo'] as const

type ExportTarget = string | { types: string; import: string }

export function buildExports(): Record<string, ExportTarget> {
  const js = (path: string): ExportTarget => ({ types: `./dist/${path}.d.ts`, import: `./dist/${path}.js` })
  const map: Record<string, ExportTarget> = {
    '.': js('index'),
    './forms': js('forms'),
    './i18n': js('i18n'),
    './theme': js('theme'),
  }
  for (const locale of LOCALES) map[`./locales/${locale}`] = js(`locales/${locale}`)
  for (const locale of LOCALES) map[`./i18n/locales/${locale}`] = js(`i18n/locales/${locale}`)
  for (const entry of componentManifest) map[`./components/${entry.name}`] = js(`components/${entry.name}`)
  map['./styles.css'] = './dist/styles.css'
  map['./tailwind.css'] = './dist/tailwind.css'
  map['./package.json'] = './package.json'
  return map
}

if (import.meta.main) {
  const path = fileURLToPath(new URL('../packages/ui/package.json', import.meta.url))
  const source = await readFile(path, 'utf8')
  const manifest = JSON.parse(source) as { exports?: unknown }
  const next = `${JSON.stringify({ ...manifest, exports: buildExports() }, null, 2)}\n`

  if (next === source) {
    console.log(`exports ok: ${Object.keys(buildExports()).length} subpaths`)
  } else if (process.argv.includes('--check')) {
    console.error('packages/ui/package.json "exports" is out of date. Run `node scripts/sync-exports.ts`.')
    process.exit(1)
  } else {
    await writeFile(path, next)
    console.log(`wrote exports: ${Object.keys(buildExports()).length} subpaths`)
  }
}
