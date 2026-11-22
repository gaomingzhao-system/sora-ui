/**
 * Type tests (`pnpm test:types`).
 *
 * tests/types contains code that must compile and, marked with
 * `@ts-expect-error` / `@vue-expect-error`, code that must not. vue-tsc
 * reports an unused directive as an error, so a declaration that becomes too
 * loose fails the run just like one that becomes too strict.
 *
 * The suite runs twice:
 *   sources  against the workspace sources
 *   dist     against the built declaration files, i.e. the types a consumer
 *            of the published packages gets (needs `pnpm build` first)
 *
 *   node scripts/test-types.ts            both (dist is required)
 *   node scripts/test-types.ts --sources  sources only
 */
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { glob, readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const sourcesOnly = process.argv.includes('--sources')

// The suite is only meaningful while it actually contains negative cases.
let positiveFiles = 0
let expectations = 0
for await (const file of glob('tests/types/**/*.{ts,vue}', { cwd: root })) {
  positiveFiles++
  const source = await readFile(`${root}${file}`, 'utf8')
  expectations += source.match(/@(?:ts|vue)-expect-error\b/g)?.length ?? 0
}
if (positiveFiles === 0 || expectations < 30) {
  console.error(
    `types: expected a real suite, found ${positiveFiles} files with ${expectations} negative cases`,
  )
  process.exit(1)
}

const run = (label: string, tsconfig: string): boolean => {
  const started = performance.now()
  const result = spawnSync('pnpm', ['exec', 'vue-tsc', '--noEmit', '-p', tsconfig], {
    cwd: root,
    encoding: 'utf8',
  })
  const output = `${result.stdout}${result.stderr}`
    .split('\n')
    .filter((line) => line.trim() !== '' && !line.includes('TNB ACTIVE'))
    .join('\n')
  const seconds = ((performance.now() - started) / 1000).toFixed(1)
  if (result.status === 0) {
    console.log(`ok    ${label.padEnd(8)} ${seconds}s`)
    return true
  }
  console.error(`FAIL  ${label.padEnd(8)} ${seconds}s\n${output}\n`)
  return false
}

let ok = run('sources', 'tests/types/tsconfig.json')

if (!sourcesOnly) {
  const declarations = [
    'packages/theme/dist/index.d.ts',
    'packages/ui/dist/index.d.ts',
    'packages/ui/dist/forms.d.ts',
  ]
  const missing = declarations.filter((file) => !existsSync(`${root}${file}`))
  if (missing.length > 0) {
    console.error(
      `FAIL  dist     not built (${missing.join(', ')}). Run \`pnpm build\` first, or pass --sources.`,
    )
    ok = false
  } else {
    ok = run('dist', 'tests/types/tsconfig.dist.json') && ok
  }
}

if (!ok) process.exit(1)
console.log(
  `types ok: ${positiveFiles} files, ${expectations} negative cases (@ts-expect-error / @vue-expect-error)`,
)
