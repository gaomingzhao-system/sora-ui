/**
 * Proves that every project-owned component is a Vapor component.
 *
 * A file name or a `vapor` attribute alone proves nothing, so this checks
 * four different things:
 *
 *   1. marker    every SFC is `<script setup lang="ts" vapor>` (parsed with the
 *                matching @vue/compiler-sfc, not grepped)
 *   2. compiled  each SFC is compiled and its output is inspected: it must be a
 *                `defineVaporComponent` and must import no VDOM helper
 *   3. dist      the built library (if present) imports no VDOM helper from `vue`
 *   4. graph     the gallery is built unminified and the production module
 *                graph is searched for the VDOM renderer
 *
 *   node scripts/check-vapor.ts             all four
 *   node scripts/check-vapor.ts --no-graph  skip the gallery build
 *
 * Declaration files are deliberately not consulted: vue-tsc types a Vapor SFC
 * with a signature that mentions `VNode`, which says nothing about runtime code.
 */
import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { glob, readFile, rm } from 'node:fs/promises'
import { relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { compileScript, parse } from '@vue/compiler-sfc'
import { componentManifest } from '../packages/ui/src/components.manifest.ts'

const root = fileURLToPath(new URL('..', import.meta.url))
const rel = (path: string): string => relative(root, path)

/** Imports from `vue` that only exist to build or patch a virtual DOM. */
const VDOM_HELPERS = new Set([
  'h',
  'cloneVNode',
  'createVNode',
  'createElementVNode',
  'createElementBlock',
  'createBlock',
  'createTextVNode',
  'createCommentVNode',
  'createStaticVNode',
  'openBlock',
  'renderSlot',
  'renderList',
  'resolveComponent',
  'resolveDynamicComponent',
  'resolveDirective',
  'withDirectives',
  'withCtx',
  'defineComponent',
  'createApp',
  'createSSRApp',
  'createRenderer',
  'render',
  'Fragment',
  'Teleport',
  'Suspense',
  'KeepAlive',
  'Transition',
  'TransitionGroup',
  'vaporInteropPlugin',
])

/** Function definitions that only exist in a bundle that contains the VDOM renderer. */
const VDOM_RENDERER_DEFINITIONS = [
  /function baseCreateRenderer\b/,
  /function createVNode\b/,
  /function createBaseVNode\b/,
  /function createElementBlock\b/,
  /function openBlock\b/,
  /function setupRenderEffect\b/,
  /function patchElement\b/,
  /function mountElement\b/,
  /function ensureRenderer\b/,
]

/** Instance-proxy properties that only exist on a VDOM component instance. */
const INSTANCE_PROXY = /\$(?:el|refs|parent|root|data|options|forceUpdate|nextTick|watch)\b/g

const problems: string[] = []
const fail = (message: string): void => {
  problems.push(message)
}

function vueImports(code: string): string[] {
  const names: string[] = []
  for (const match of code.matchAll(/import\s*\{([^}]*)\}\s*from\s*['"]vue['"]/g)) {
    for (const part of (match[1] ?? '').split(',')) {
      const name = part
        .trim()
        .split(/\s+as\s+/)[0]
        ?.trim()
      if (name) names.push(name)
    }
  }
  return names
}

// ------------------------------------------------------------ 1 + 2: sources
const patterns = ['packages/*/src/**/*.vue', 'apps/*/src/**/*.vue', 'tests/**/*.vue']
const files: string[] = []
for (const pattern of patterns) {
  for await (const file of glob(pattern, { cwd: root, exclude: (name) => name === 'node_modules' })) {
    files.push(`${root}${file}`)
  }
}
files.sort()

let compiled = 0
for (const file of files) {
  const source = await readFile(file, 'utf8')
  const { descriptor, errors } = parse(source, { filename: file })
  if (errors.length > 0) {
    fail(`${rel(file)}: does not parse: ${String(errors[0])}`)
    continue
  }
  const setup = descriptor.scriptSetup
  if (!setup) {
    fail(`${rel(file)}: no <script setup>`)
    continue
  }
  if (descriptor.script) fail(`${rel(file)}: has a second, non-setup <script> block`)
  if (setup.lang !== 'ts') fail(`${rel(file)}: <script setup> is not lang="ts"`)
  // The marker, as the compiler itself reports it.
  if (descriptor.vapor !== true || setup.attrs['vapor'] !== true) {
    fail(`${rel(file)}: <script setup> has no explicit \`vapor\` marker`)
    continue
  }
  if (file.includes('/packages/') && descriptor.styles.length > 0) {
    fail(`${rel(file)}: library SFCs must not contain <style> (CSS is an explicit import)`)
  }
  // A Vapor component has no instance proxy: these compile and type-check
  // (vue-tsc types the template against the classic instance) but are
  // undefined at runtime. `$attrs`, `$slots`, `$props` and `$emit` do exist.
  const template = descriptor.template?.content ?? ''
  const proxy = template.match(INSTANCE_PROXY)
  if (proxy)
    fail(
      `${rel(file)}: template uses ${[...new Set(proxy)].join(', ')}, which a Vapor component does not have`,
    )

  try {
    // No plugin-level `vapor: true` here: only the file's own marker counts.
    const result = compileScript(descriptor, { id: rel(file), inlineTemplate: true, isProd: true })
    compiled++
    if (!result.content.includes('defineVaporComponent')) {
      fail(`${rel(file)}: compiled output is not a defineVaporComponent`)
    }
    const vdom = vueImports(result.content).filter((name) => VDOM_HELPERS.has(name))
    if (vdom.length > 0) fail(`${rel(file)}: compiled output imports VDOM helpers: ${vdom.join(', ')}`)
  } catch (error) {
    fail(`${rel(file)}: does not compile: ${error instanceof Error ? error.message : String(error)}`)
  }
}

// Every manifest component is one of the checked files.
for (const entry of componentManifest) {
  if (!files.includes(`${root}packages/ui/src/${entry.source}`)) {
    fail(`manifest: ${entry.name} points at a missing source (${entry.source})`)
  }
}

// --------------------------------------------------------------- 3: built lib
const dist = `${root}packages/ui/dist`
let distFiles = 0
if (existsSync(dist)) {
  for await (const file of glob('**/*.js', { cwd: dist })) {
    distFiles++
    const code = await readFile(`${dist}/${file}`, 'utf8')
    const vdom = vueImports(code).filter((name) => VDOM_HELPERS.has(name))
    if (vdom.length > 0) fail(`packages/ui/dist/${file}: imports VDOM helpers: ${vdom.join(', ')}`)
  }
  for (const entry of componentManifest) {
    const file = `${dist}/components/${entry.name}.js`
    if (!existsSync(file)) {
      fail(`packages/ui/dist: missing components/${entry.name}.js`)
      continue
    }
    // The entry either defines the component or re-exports it from a shared chunk.
    const code = await readFile(file, 'utf8')
    const chunk = /from\s*"(\.\.\/[^"]+\.js)"/.exec(code)?.[1]
    const body = code.includes('defineVaporComponent')
      ? code
      : chunk
        ? await readFile(`${dist}/components/${chunk}`, 'utf8')
        : ''
    if (!body.includes('defineVaporComponent')) {
      fail(`packages/ui/dist/components/${entry.name}.js: no defineVaporComponent in the built component`)
    }
  }
}

// ------------------------------------------------------ 4: production graph
let graph = 'skipped (--no-graph)'
if (!process.argv.includes('--no-graph')) {
  const outDir = `${root}.artifacts/vapor-graph`
  await rm(outDir, { recursive: true, force: true })
  execFileSync(
    'pnpm',
    [
      'exec',
      'vite',
      'build',
      '--minify',
      'false',
      '--sourcemap',
      'false',
      '--outDir',
      outDir,
      '--logLevel',
      'error',
    ],
    { cwd: `${root}apps/gallery`, stdio: ['ignore', 'ignore', 'inherit'] },
  )
  let code = ''
  for await (const file of glob('assets/*.js', { cwd: outDir })) {
    code += await readFile(`${outDir}/${file}`, 'utf8')
  }
  // Comments mention renderer internals by name; only real definitions count.
  const withoutComments = code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
  for (const pattern of VDOM_RENDERER_DEFINITIONS) {
    if (pattern.test(withoutComments))
      fail(`gallery production graph contains the VDOM renderer (${pattern.source})`)
  }
  if (!/createVaporApp/.test(withoutComments))
    fail('gallery production graph does not contain createVaporApp')
  // Unminified output keeps one `// <module path>` (or `//#region <path>`) line per bundled module.
  const modules = new Set(
    [...code.matchAll(/^\/\/(?:#region)? ?((?:\.\.?\/|\/)\S+)$/gm)].map(
      (match) => (match[1] ?? '').split('?')[0] ?? '',
    ),
  )
  if (modules.size === 0)
    fail('gallery production graph: no module markers found (bundler output format changed?)')
  const vuePackages = [...modules].filter((id) =>
    /node_modules\/@vue\/(?:shared|reactivity|runtime-[a-z]+)\//.test(id),
  )
  const distinct = new Set(vuePackages.map((id) => /node_modules\/(@vue\/[a-z-]+)\//.exec(id)?.[1]))
  // One copy of each Vue package: a second copy would mean a second reactivity system.
  if (vuePackages.length !== distinct.size) {
    fail(`gallery graph has duplicate Vue packages:\n  ${vuePackages.join('\n  ')}`)
  }
  if (!distinct.has('@vue/runtime-vapor'))
    fail('gallery production graph does not include @vue/runtime-vapor')
  // Formisch's own Form/Field components are VDOM SFCs: they must be tree-shaken away.
  if (/Form_vue_vue_type_script|Field_vue_vue_type_script/.test(withoutComments)) {
    fail('gallery production graph contains Formisch VDOM components')
  }
  graph = `${(code.length / 1024).toFixed(0)} KiB unminified, ${modules.size} modules, one copy of ${[...distinct].toSorted().join(', ')}, no VDOM renderer`
}

if (problems.length > 0) {
  for (const problem of problems) console.error(`vapor: ${problem}`)
  console.error(`\n${problems.length} problem(s).`)
  process.exit(1)
}

console.log(`marker    ${files.length} SFCs carry <script setup lang="ts" vapor>`)
console.log(`compiled  ${compiled} SFCs compile to defineVaporComponent with no VDOM helper`)
console.log(
  distFiles > 0
    ? `dist      ${distFiles} built modules import no VDOM helper`
    : 'dist      not built (run `pnpm build` first)',
)
console.log(`graph     ${graph}`)
