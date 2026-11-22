/**
 * Generates the default design system from the root `sora.config.ts`.
 *
 *   node scripts/generate-theme.ts          write the generated files
 *   node scripts/generate-theme.ts --check  fail if they are out of date (CI)
 *
 * The stylesheet and the runtime defaults come from the same resolved
 * configuration that `SoraProvider`/`createThemeVars` use at runtime, so colour
 * values are never maintained twice.
 */
import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { auditContrast, resolveTheme, themeToCss, type SoraConfigInput } from '../packages/theme/src/index.ts'

const root = fileURLToPath(new URL('..', import.meta.url))
const cssPath = `${root}packages/ui/src/styles/theme.generated.css`
const tsPath = `${root}packages/ui/src/config.generated.ts`
const check = process.argv.includes('--check')

// `sora.config.ts` imports '@your-scope/theme' by name; resolve that to the
// workspace source so generation never depends on a previous build.
const { registerHooks } = await import('node:module')
registerHooks({
  resolve: (specifier, context, nextResolve) => {
    if (specifier === '@your-scope/theme') {
      return { url: new URL('../packages/theme/src/index.ts', import.meta.url).href, shortCircuit: true }
    }
    return nextResolve(specifier, context)
  },
})
const { default: config } = (await import('../sora.config.ts')) as { default: SoraConfigInput<string> }

const theme = resolveTheme(config)
const failures = auditContrast(theme).filter((entry) => !entry.pass)
for (const warning of theme.warnings) console.warn(`warning: ${warning}`)
if (failures.length > 0) {
  for (const failure of failures) {
    console.error(
      `contrast: ${failure.id} [${failure.scheme}] is ${failure.ratio.toFixed(2)}:1, needs ${failure.required}:1`,
    )
  }
  console.error(`\n${failures.length} contrast requirement(s) failed for sora.config.ts.`)
  process.exit(1)
}

const banner = [
  '/*',
  ' * GENERATED FILE - do not edit.',
  ' * Source: sora.config.ts -> @your-scope/theme resolveTheme() -> scripts/generate-theme.ts',
  ' * Regenerate with `pnpm generate:theme`.',
  ' */',
].join('\n')

const css = themeToCss(theme, { banner })
const ts = `${banner}
import type { SoraComponentDefaults, SoraDensity, SoraMotion, SoraRadius } from '@your-scope/theme'

/** Component prop defaults resolved from sora.config.ts. */
export const generatedDefaults: SoraComponentDefaults = ${JSON.stringify(theme.config.defaults, null, 2)}

export const generatedDensity: SoraDensity = '${theme.config.density}'
export const generatedRadius: SoraRadius = '${theme.config.radius}'
export const generatedMotion: SoraMotion = '${theme.config.motion}'
`

const current = async (path: string): Promise<string | undefined> => {
  try {
    return await readFile(path, 'utf8')
  } catch {
    return undefined
  }
}

let stale = false
for (const [path, content] of [
  [cssPath, css],
  [tsPath, ts],
] as const) {
  if ((await current(path)) === content) continue
  if (check) {
    stale = true
    console.error(`out of date: ${path.slice(root.length)}`)
  } else {
    await writeFile(path, content)
    console.log(`wrote ${path.slice(root.length)}`)
  }
}

if (stale) {
  console.error('\nGenerated theme files are stale. Run `pnpm generate:theme` and commit the result.')
  process.exit(1)
}
console.log(
  `theme ok: ${theme.colors.length} colour tokens, ${auditContrast(theme).length} contrast checks passed, ` +
    `density=${theme.config.density} radius=${theme.config.radius} motion=${theme.config.motion}`,
)
