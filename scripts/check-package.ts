/**
 * Checks the publishable packages as artifacts (run after `pnpm build`).
 *
 *   exports     the explicit `exports` map matches the component manifest and
 *               every target exists
 *   tarball     `pnpm pack` output: only dist + metadata, no workspace protocol
 *   isolation   the JavaScript *and* declaration graphs of each entry import
 *               only what that entry is allowed to (the core entry never
 *               reaches Formisch, Valibot, petite-vue-i18n or another locale)
 *   types       the published declarations type-check on their own
 *   styles      the stylesheet is compiled, layered and Preflight-free
 *   publint     the registry-facing metadata lints clean
 *
 *   node scripts/check-package.ts
 */
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { dirname, join, relative } from 'node:path'
import ts from 'typescript'
import { componentManifest } from '../packages/ui/src/components.manifest.ts'
import { packPackages, root, run, tarballFile, tarballFiles } from './shared.ts'
import { buildExports } from './sync-exports.ts'

const problems: string[] = []
const fail = (message: string): void => {
  problems.push(message)
}
const notes: string[] = []

const uiDir = `${root}packages/ui`
const themeDir = `${root}packages/theme`

// ------------------------------------------------------------------ exports
const expected = buildExports()
const uiManifest = JSON.parse(await readFile(`${uiDir}/package.json`, 'utf8')) as {
  exports: Record<string, string | { types: string; import: string }>
  sideEffects?: unknown
  dependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
  peerDependenciesMeta?: Record<string, { optional?: boolean }>
}
if (JSON.stringify(uiManifest.exports) !== JSON.stringify(expected)) {
  fail(
    'packages/ui/package.json "exports" is out of sync with the manifest (run `node scripts/sync-exports.ts`)',
  )
}
for (const [subpath, target] of Object.entries(uiManifest.exports)) {
  if (subpath.includes('*')) fail(`exports: "${subpath}" is a wildcard; subpaths must be explicit`)
  for (const file of typeof target === 'string' ? [target] : [target.types, target.import]) {
    if (!existsSync(join(uiDir, file))) fail(`exports: "${subpath}" points at a missing file (${file})`)
  }
}
for (const entry of componentManifest) {
  if (!(`./components/${entry.name}` in uiManifest.exports)) fail(`exports: no subpath for ${entry.name}`)
}
if (JSON.stringify(uiManifest.sideEffects) !== JSON.stringify(['**/*.css'])) {
  fail('packages/ui: "sideEffects" must be ["**/*.css"] (CSS is the only side effect)')
}
for (const peer of ['@formisch/vue', 'valibot', 'petite-vue-i18n']) {
  if (!uiManifest.peerDependencies?.[peer]) fail(`packages/ui: ${peer} must be a peer dependency`)
  if (uiManifest.peerDependenciesMeta?.[peer]?.optional !== true)
    fail(`packages/ui: peer ${peer} must be optional`)
}
if (uiManifest.peerDependencies?.['vue'] !== '3.6.0-rc.15') {
  fail('packages/ui: the vue peer must be the exact tested release (3.6.0-rc.15)')
}
notes.push(`exports     ${Object.keys(uiManifest.exports).length} explicit subpaths, all targets present`)

// ------------------------------------------------------------------ tarball
const packed = await packPackages()
for (const { name, tarball } of packed) {
  const files = tarballFiles(tarball)
  const stray = files.filter((file) => !/^(dist\/|package\.json$|LICENSE$|README\.md$)/.test(file))
  if (stray.length > 0) fail(`${name} tarball contains unexpected files: ${stray.slice(0, 5).join(', ')}`)
  if (!files.includes('LICENSE')) fail(`${name} tarball has no LICENSE`)
  if (!files.some((file) => file.endsWith('.d.ts'))) fail(`${name} tarball has no declarations`)
  const manifest = tarballFile(tarball, 'package.json')
  if (manifest.includes('workspace:')) fail(`${name} tarball still contains a workspace: range`)
  if (manifest.includes('catalog:')) fail(`${name} tarball still contains a catalog: range`)
  notes.push(`tarball     ${name}: ${files.length} files`)
}
const packedUi = packed.find((entry) => entry.name === '@your-scope/ui')
if (packedUi) {
  const manifest = JSON.parse(tarballFile(packedUi.tarball, 'package.json')) as {
    dependencies?: Record<string, string>
  }
  const range = manifest.dependencies?.['@your-scope/theme']
  if (!range || !/^\^?\d/.test(range))
    fail(`@your-scope/ui tarball: @your-scope/theme dependency is "${range}"`)
}

// ---------------------------------------------------------------- isolation
type Kind = 'js' | 'dts'

/** Bare specifiers reachable from an entry, following relative imports. */
async function externalImports(entry: string, kind: Kind): Promise<Set<string>> {
  const seen = new Set<string>()
  const externals = new Set<string>()
  const queue = [entry]
  while (queue.length > 0) {
    const file = queue.pop()
    if (!file || seen.has(file)) continue
    seen.add(file)
    // Comments may quote import statements (usage examples): only real code counts.
    const code = (await readFile(file, 'utf8')).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
    const specifiers = [
      ...code.matchAll(/(?:from|import)\s*["']([^"']+)["']/g),
      ...code.matchAll(/import\(\s*["']([^"']+)["']\s*\)/g),
    ].map((match) => match[1] ?? '')
    for (const specifier of specifiers) {
      if (!specifier.startsWith('.')) {
        externals.add(specifier)
        continue
      }
      let target = join(dirname(file), specifier)
      // Declarations import `./x.js`; the file on disk is `./x.d.ts`.
      if (kind === 'dts') target = target.replace(/\.js$/, '.d.ts')
      if (existsSync(target)) queue.push(target)
      else fail(`${relative(root, file)}: relative import "${specifier}" does not resolve`)
    }
  }
  return externals
}

const VUE = ['vue']
const THEME = ['@your-scope/theme']
interface Rule {
  entry: string
  js: readonly string[]
  dts: readonly string[]
}
const rules: Rule[] = [
  // The core entry: Vue only. Its *types* may also name @your-scope/theme (a real dependency).
  { entry: 'index', js: VUE, dts: [...VUE, ...THEME] },
  { entry: 'forms', js: [...VUE, '@formisch/vue'], dts: [...VUE, ...THEME, '@formisch/vue', 'valibot'] },
  { entry: 'i18n', js: [...VUE, 'petite-vue-i18n'], dts: [...VUE, ...THEME, 'petite-vue-i18n'] },
  { entry: 'theme', js: [...VUE, ...THEME], dts: [...VUE, ...THEME] },
  ...['en', 'ja', 'ar', 'pseudo'].flatMap((locale) => [
    { entry: `locales/${locale}`, js: [], dts: [] },
    { entry: `i18n/locales/${locale}`, js: [], dts: [] },
  ]),
  ...componentManifest.map((entry) =>
    entry.entry === 'forms'
      ? {
          entry: `components/${entry.name}`,
          js: [...VUE, '@formisch/vue'],
          dts: [...VUE, ...THEME, '@formisch/vue', 'valibot'],
        }
      : { entry: `components/${entry.name}`, js: VUE, dts: [...VUE, ...THEME] },
  ),
]

for (const rule of rules) {
  for (const kind of ['js', 'dts'] as const) {
    const file = `${uiDir}/dist/${rule.entry}.${kind === 'js' ? 'js' : 'd.ts'}`
    if (!existsSync(file)) {
      fail(`dist/${rule.entry}: missing ${kind} file`)
      continue
    }
    const allowed = new Set(rule[kind])
    const extra = [...(await externalImports(file, kind))].filter((specifier) => !allowed.has(specifier))
    if (extra.length > 0)
      fail(
        `dist/${rule.entry} (${kind}) reaches ${extra.join(', ')}; allowed: ${[...allowed].join(', ') || 'nothing'}`,
      )
  }
}

// The core entry bundles English only.
const coreJs = [...(await moduleClosure(`${uiDir}/dist/index.js`))]
for (const file of coreJs) {
  const code = await readFile(file, 'utf8')
  if (/次のページ|الصفحة التالية/.test(code))
    fail(`core entry includes a non-English locale (${relative(root, file)})`)
}
async function moduleClosure(entry: string): Promise<Set<string>> {
  const seen = new Set<string>()
  const queue = [entry]
  while (queue.length > 0) {
    const file = queue.pop()
    if (!file || seen.has(file)) continue
    seen.add(file)
    const code = await readFile(file, 'utf8')
    for (const match of code.matchAll(/(?:from|import)\s*["'](\.[^"']+)["']/g)) {
      const target = join(dirname(file), match[1] ?? '')
      if (existsSync(target)) queue.push(target)
    }
  }
  return seen
}
notes.push(`isolation   ${rules.length} entries: JavaScript and declaration graphs import only what they may`)

// -------------------------------------------------------------------- types
// The declarations as a consumer sees them: no path aliases, no source files.
const declarationEntries = [
  ...Object.values(uiManifest.exports).flatMap((target) =>
    typeof target === 'string' ? [] : [join(uiDir, target.types)],
  ),
  `${themeDir}/dist/index.d.ts`,
]
const program = ts.createProgram({
  rootNames: declarationEntries,
  options: {
    noEmit: true,
    strict: true,
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    lib: ['lib.esnext.d.ts', 'lib.dom.d.ts', 'lib.dom.iterable.d.ts'],
    types: [],
    // Check the library's own .d.ts files (errors inside dependencies are filtered out below).
    skipLibCheck: false,
  },
})
const ours = (fileName: string): boolean =>
  fileName.startsWith(`${uiDir}/dist/`) || fileName.startsWith(`${themeDir}/dist/`)
const diagnostics = ts
  .getPreEmitDiagnostics(program)
  .filter((diagnostic) => diagnostic.file && ours(diagnostic.file.fileName))
for (const diagnostic of diagnostics.slice(0, 20)) {
  const file = diagnostic.file
  const position =
    file && diagnostic.start !== undefined ? file.getLineAndCharacterOfPosition(diagnostic.start) : undefined
  fail(
    `${file ? relative(root, file.fileName) : '?'}${position ? `(${position.line + 1},${position.character + 1})` : ''}: ` +
      ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
  )
}
notes.push(
  `types       ${declarationEntries.length} declaration entries type-check standalone (TypeScript ${ts.version} API)`,
)

// ------------------------------------------------------------------- styles
const css = await readFile(`${uiDir}/dist/styles.css`, 'utf8')
if (
  !css.includes('@layer theme,base,components,utilities') &&
  !css.includes('@layer theme, base, components, utilities')
) {
  fail('styles.css does not declare the canonical layer order')
}
// Everything except @property/@keyframes registrations must be inside a layer.
// (A private-use character stands in for each `@layer x {` opener.)
const unlayered = css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/@layer\s+[\w.-]+\s*\{/g, '\uE000')
if (/^[^@\uE000]*\{/.test(unlayered.trimStart())) fail('styles.css starts with an unlayered rule')
for (const needle of ['--sora-canvas', '.sora-button', '.sora-dialog', 'light-dark(', 'position-area']) {
  if (!css.includes(needle)) fail(`styles.css is missing ${needle}`)
}
if (/\.(?:container|sr-only|flex|hidden)\s*\{/.test(css))
  fail('styles.css emits an un-namespaced utility class')
const integration = await readFile(`${uiDir}/dist/tailwind.css`, 'utf8')
if (!integration.includes('@theme inline')) fail('tailwind.css must contain the @theme inline mapping')
if (/--spacing\s*:/.test(integration)) fail('tailwind.css must not redefine the host --spacing scale')
notes.push(
  `styles      styles.css ${(css.length / 1024).toFixed(1)} KiB, layered, no Preflight; tailwind.css maps tokens only`,
)

// ------------------------------------------------------------------ publint
for (const dir of [themeDir, uiDir]) {
  try {
    const output = run('pnpm', ['exec', 'publint', dir, '--strict'])
    if (!/All good!/.test(output)) fail(`publint ${relative(root, dir)}:\n${output.trim()}`)
  } catch (error) {
    fail(`publint ${relative(root, dir)}:\n${error instanceof Error ? error.message : String(error)}`)
  }
}
notes.push('publint     both packages: all good')

if (problems.length > 0) {
  for (const problem of problems) console.error(`package: ${problem}`)
  console.error(`\n${problems.length} problem(s).`)
  process.exit(1)
}
for (const note of notes) console.log(note)
