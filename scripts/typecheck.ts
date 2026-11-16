/**
 * Type-checks every project with vue-tsc (the TypeScript 7 engine behind the
 * classic compiler API; see docs/compatibility.md).
 *
 *   node scripts/typecheck.ts            all projects
 *   node scripts/typecheck.ts ui gallery only the named ones
 */
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))

const projects: Readonly<Record<string, string>> = {
  theme: 'packages/theme/tsconfig.json',
  ui: 'packages/ui/tsconfig.json',
  gallery: 'apps/gallery/tsconfig.json',
  tests: 'tests/tsconfig.json',
  unit: 'tests/unit/tsconfig.json',
  e2e: 'tests/e2e/tsconfig.json',
  tooling: 'tsconfig.json',
}

const requested = process.argv.slice(2)
const names = requested.length > 0 ? requested : Object.keys(projects)
let failed = false

for (const name of names) {
  const tsconfig = projects[name]
  if (!tsconfig) {
    console.error(`unknown project "${name}". Known: ${Object.keys(projects).join(', ')}`)
    process.exit(2)
  }
  const started = performance.now()
  const result = spawnSync('pnpm', ['exec', 'vue-tsc', '--noEmit', '-p', tsconfig], {
    cwd: root,
    encoding: 'utf8',
  })
  // The bridge prints a one-line banner; keep the report to real diagnostics.
  const output = `${result.stdout}${result.stderr}`
    .split('\n')
    .filter((line) => line.trim() !== '' && !line.includes('TNB ACTIVE'))
    .join('\n')
  const seconds = ((performance.now() - started) / 1000).toFixed(1)
  if (result.status === 0) {
    console.log(`ok    ${name.padEnd(8)} ${seconds}s`)
  } else {
    failed = true
    console.error(`FAIL  ${name.padEnd(8)} ${seconds}s\n${output}\n`)
  }
}

process.exit(failed ? 1 : 0)
