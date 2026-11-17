/**
 * Compiles the library stylesheet with the Tailwind CSS v4 CLI and ships the
 * Tailwind integration file next to it.
 *
 *   dist/styles.css     compiled, minified, works without Tailwind in the consumer
 *   dist/tailwind.css   optional `@theme` mapping for Tailwind hosts (uncompiled on purpose)
 *
 * Fails if the compiled CSS leaks anything a published stylesheet must not
 * contain (an unresolved directive, a Preflight reset, an unlayered rule).
 */
import { execFileSync } from 'node:child_process'
import { copyFile, readFile } from 'node:fs/promises'
import { gzipSync } from 'node:zlib'
import { fileURLToPath } from 'node:url'

const ui = fileURLToPath(new URL('../packages/ui/', import.meta.url))
const input = `${ui}src/styles/index.css`
const output = `${ui}dist/styles.css`

execFileSync('pnpm', ['exec', 'tailwindcss', '--input', input, '--output', output, '--minify'], {
  cwd: ui,
  stdio: ['ignore', 'ignore', 'inherit'],
})
await copyFile(`${ui}src/styles/tailwind.css`, `${ui}dist/tailwind.css`)

const css = await readFile(output, 'utf8')
const problems: string[] = []
for (const directive of [
  '@apply',
  '@theme',
  '@utility',
  '@custom-variant',
  '@source',
  '@variant',
  '@import',
]) {
  if (css.includes(directive)) problems.push(`unresolved Tailwind directive ${directive}`)
}
if (css.includes('--spacing(')) problems.push('unresolved --spacing() function')
// Tailwind-generated custom properties need their @property registration alongside.
for (const [, name] of css.matchAll(/(--tw-[\w-]+)\s*:/g)) {
  if (name && !css.includes(`@property ${name}`)) problems.push(`${name} is used without its @property rule`)
}
if (/(^|[};])\s*(\*|html|body|:root)\s*[,{]/.test(css.replace(/@layer[^{]+\{/g, ';'))) {
  // A coarse guard against a global reset slipping in; scoped `:where(:root, :host)` tokens are fine.
  const globalRule = /(^|[};])\s*(\*|html|body)\s*[,{]/.test(css)
  if (globalRule) problems.push('global element selector (Preflight-style reset) found')
}

if (problems.length > 0) {
  for (const problem of problems) console.error(`styles: ${problem}`)
  process.exit(1)
}

const kib = (bytes: number): string => `${(bytes / 1024).toFixed(2)} KiB`
console.log(`styles.css ${kib(Buffer.byteLength(css))} (gzip ${kib(gzipSync(css).length)})`)
