/**
 * Locale checks for the library and the gallery.
 *
 *   - key parity: en, ja, ar (and the pseudo-locale) have exactly the same keys
 *   - placeholder parity: every translation uses the same `{name}` set as English
 *   - syntax: flat string values only, no linked messages (`@`), plural pipes
 *     (`|`) or HTML, and every message compiles with the message compiler
 *   - usage: every literal key passed to `t()` in the sources exists
 *
 *   node scripts/check-locales.ts
 */
import { glob, readFile } from 'node:fs/promises'
import { relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { compileMessages } from './compiled-messages-plugin.ts'

const root = fileURLToPath(new URL('..', import.meta.url))
const problems: string[] = []

type Dictionary = Readonly<Record<string, string>>

async function load(path: string): Promise<Dictionary> {
  return ((await import(`${root}${path}`)) as { default: Dictionary }).default
}

const placeholders = (message: string): string =>
  [...message.matchAll(/\{(\w+)\}/g)]
    .map((match) => match[1] ?? '')
    .toSorted()
    .join(',')

function checkSet(name: string, base: Dictionary, others: Readonly<Record<string, Dictionary>>): void {
  const keys = Object.keys(base)
  for (const [key, message] of Object.entries(base)) {
    if (typeof message !== 'string' || message.trim() === '') problems.push(`${name} en: "${key}" is empty`)
    if (/[@|<>]/.test(message))
      problems.push(`${name} en: "${key}" uses @, |, < or > (not allowed in flat messages)`)
  }
  for (const [locale, dictionary] of Object.entries(others)) {
    const present = new Set(Object.keys(dictionary))
    for (const key of keys) {
      const message = dictionary[key]
      if (message === undefined) {
        problems.push(`${name} ${locale}: missing "${key}"`)
        continue
      }
      if (typeof message !== 'string' || message.trim() === '')
        problems.push(`${name} ${locale}: "${key}" is empty`)
      else if (/[@|<>]/.test(message)) problems.push(`${name} ${locale}: "${key}" uses @, |, < or >`)
      if (placeholders(message) !== placeholders(base[key] ?? '')) {
        problems.push(
          `${name} ${locale}: "${key}" placeholders {${placeholders(message)}} differ from English {${placeholders(base[key] ?? '')}}`,
        )
      }
      present.delete(key)
    }
    for (const extra of present) problems.push(`${name} ${locale}: unknown key "${extra}"`)
    // Every dictionary must survive precompilation (that is what gets published).
    try {
      compileMessages(dictionary, `${name} ${locale}`)
    } catch (error) {
      problems.push(error instanceof Error ? error.message : String(error))
    }
  }
}

const ui = {
  en: await load('packages/ui/src/locales/en.ts'),
  ja: await load('packages/ui/src/locales/ja.ts'),
  ar: await load('packages/ui/src/locales/ar.ts'),
  pseudo: await load('packages/ui/src/locales/pseudo.ts'),
}
const gallery = {
  en: await load('apps/gallery/src/locales/en.ts'),
  ja: await load('apps/gallery/src/locales/ja.ts'),
  ar: await load('apps/gallery/src/locales/ar.ts'),
  pseudo: await load('apps/gallery/src/locales/pseudo.ts'),
}

checkSet('ui', ui.en, ui)
checkSet('gallery', gallery.en, gallery)

for (const key of Object.keys(gallery.en)) {
  if (key in ui.en) problems.push(`gallery en: "${key}" shadows a library key`)
}

// Arabic and Japanese must actually be translated, not copies of English
// (identical strings are fine for names and symbols, so only flag a majority).
for (const [name, set] of [
  ['ui', ui],
  ['gallery', gallery],
] as const) {
  for (const locale of ['ja', 'ar'] as const) {
    const same = Object.keys(set.en).filter((key) => set[locale][key] === set.en[key]).length
    if (same > Object.keys(set.en).length * 0.1) {
      problems.push(`${name} ${locale}: ${same} messages are identical to English`)
    }
  }
}

// ----------------------------------------------------------------- key usage
async function usedKeys(patterns: readonly string[]): Promise<Map<string, string>> {
  const used = new Map<string, string>()
  for (const pattern of patterns) {
    for await (const file of glob(pattern, { cwd: root })) {
      const source = await readFile(`${root}${file}`, 'utf8')
      // Literal keys only: t('a.b'), t("a.b") and the static head of t(`a.${x}`).
      for (const match of source.matchAll(/\bt\(\s*(['"])([\w.-]+)\1/g)) {
        used.set(match[2] ?? '', relative(root, `${root}${file}`))
      }
    }
  }
  return used
}

const uiUsed = await usedKeys(['packages/ui/src/**/*.vue', 'packages/ui/src/**/*.ts'])
for (const [key, file] of uiUsed) {
  if (!(key in ui.en)) problems.push(`${file}: t('${key}') is not a library message`)
}
const galleryUsed = await usedKeys(['apps/gallery/src/**/*.vue', 'apps/gallery/src/**/*.ts'])
for (const [key, file] of galleryUsed) {
  if (!(key in gallery.en) && !(key in ui.en)) problems.push(`${file}: t('${key}') is not a known message`)
}

// Library keys nobody uses are dead weight in every locale chunk. Validation
// messages are for applications (schemas) and actions.* are shared vocabulary.
const unused = Object.keys(ui.en).filter(
  (key) => !uiUsed.has(key) && !key.startsWith('validation.') && !key.startsWith('actions.'),
)
for (const key of unused) problems.push(`ui en: "${key}" is never used by the library`)

if (problems.length > 0) {
  for (const problem of problems) console.error(`locales: ${problem}`)
  console.error(`\n${problems.length} problem(s).`)
  process.exit(1)
}

console.log(
  `locales ok: library ${Object.keys(ui.en).length} keys x ${Object.keys(ui).length} locales, ` +
    `gallery ${Object.keys(gallery.en).length} keys x ${Object.keys(gallery).length} locales, ` +
    `${uiUsed.size + galleryUsed.size} literal t() keys resolved`,
)
