/**
 * Measures what the library costs an application, from the packed artifact.
 *
 * Every figure is produced by building a tiny application against the
 * tarball-installed package in .artifacts/consumers/basic (run
 * `pnpm verify:consumer` first) and gzipping the emitted files:
 *
 *   baseline        a Vapor app with no library import (the Vue runtime)
 *   button + card   the same app using SoraButton and SoraCard
 *   -> incremental  the difference: the budgeted number
 *   every export    an app that keeps every export of the core entry
 *   styles.css      the compiled stylesheet
 *
 *   node scripts/measure-bundle.ts          print the table, fail over budget
 *   node scripts/measure-bundle.ts --json   also write .artifacts/bundle-report.json
 */
import { existsSync } from 'node:fs'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { artifacts, consumerDir, gzipSize, gzipSizeOfFiles, kib, root, run } from './shared.ts'

/** Budgets from the specification: engineering targets, enforced here. */
const BUDGET = {
  buttonCardIncrementalGzip: 10 * 1024,
  stylesheetGzip: 35 * 1024,
}

const app = `${consumerDir}/basic`
if (!existsSync(`${app}/node_modules/@your-scope/ui`)) {
  console.error('The basic consumer is not installed. Run `pnpm verify:consumer` first.')
  process.exit(1)
}

const SHELL = `<!doctype html><html lang="en"><head><meta charset="UTF-8" /><title>measure</title></head><body><div id="app"></div><script type="module" src="./main.ts"></script></body></html>\n`

const VARIANTS: Readonly<Record<string, { main: string; app: string }>> = {
  baseline: {
    main: `import { createVaporApp } from 'vue'\nimport App from './App.vue'\ncreateVaporApp(App).mount('#app')\n`,
    app: `<script setup lang="ts" vapor>
import { ref } from 'vue'
const count = ref(0)
</script>
<template>
  <section><h2>Title</h2><p>{{ count }}</p><button type="button" @click="count++">Increment</button></section>
</template>
`,
  },
  'button-card': {
    main: `import { createVaporApp } from 'vue'\nimport App from './App.vue'\ncreateVaporApp(App).mount('#app')\n`,
    app: `<script setup lang="ts" vapor>
import { ref } from 'vue'
import { SoraButton, SoraCard } from '@your-scope/ui'
const count = ref(0)
</script>
<template>
  <SoraCard title="Title"><p>{{ count }}</p><template #footer><SoraButton @click="count++">Increment</SoraButton></template></SoraCard>
</template>
`,
  },
  'every-export': {
    main: `import { createVaporApp } from 'vue'
import * as ui from '@your-scope/ui'
import App from './App.vue'
// Referencing the namespace object keeps every export of the core entry.
;(globalThis as { __sora?: unknown }).__sora = ui
createVaporApp(App).mount('#app')
`,
    app: `<script setup lang="ts" vapor>
import { ref } from 'vue'
const count = ref(0)
</script>
<template>
  <section><h2>Title</h2><p>{{ count }}</p><button type="button" @click="count++">Increment</button></section>
</template>
`,
  },
}

const work = `${app}/.measure`
await rm(work, { recursive: true, force: true })

const sizes: Record<string, { raw: number; gzip: number; files: number }> = {}
for (const [name, files] of Object.entries(VARIANTS)) {
  const dir = `${work}/${name}`
  await mkdir(dir, { recursive: true })
  await writeFile(`${dir}/index.html`, SHELL)
  await writeFile(`${dir}/main.ts`, files.main)
  await writeFile(`${dir}/App.vue`, files.app)
  // The consumer's own vite.config.ts (Vapor plugin, production defines) with this folder as the root.
  run(
    'pnpm',
    [
      'exec',
      'vite',
      'build',
      dir,
      '--config',
      `${app}/vite.config.ts`,
      '--outDir',
      `${dir}/dist`,
      '--emptyOutDir',
      '--logLevel',
      'error',
    ],
    { cwd: app },
  )
  sizes[name] = await gzipSizeOfFiles(`${dir}/dist`, '.js')
}
await rm(work, { recursive: true, force: true })

const css = await readFile(`${root}packages/ui/dist/styles.css`)
const stylesheet = { raw: css.length, gzip: gzipSize(css) }

const baseline = sizes['baseline']
const buttonCard = sizes['button-card']
const everything = sizes['every-export']
if (!baseline || !buttonCard || !everything) throw new Error('a measurement is missing')

const incremental = buttonCard.gzip - baseline.gzip
const rows: [string, string, string][] = [
  ['baseline (Vue Vapor runtime)', kib(baseline.raw), kib(baseline.gzip)],
  ['SoraButton + SoraCard app', kib(buttonCard.raw), kib(buttonCard.gzip)],
  ['-> incremental (budget 10 KiB)', kib(buttonCard.raw - baseline.raw), kib(incremental)],
  ['every core export', kib(everything.raw - baseline.raw), kib(everything.gzip - baseline.gzip)],
  ['styles.css (budget 35 KiB)', kib(stylesheet.raw), kib(stylesheet.gzip)],
]
const width = Math.max(...rows.map((row) => row[0].length))
console.log(`${'JavaScript / CSS'.padEnd(width)}  ${'minified'.padStart(11)}  ${'gzip'.padStart(11)}`)
for (const [label, raw, gzip] of rows)
  console.log(`${label.padEnd(width)}  ${raw.padStart(11)}  ${gzip.padStart(11)}`)

if (process.argv.includes('--json')) {
  await mkdir(artifacts, { recursive: true })
  await writeFile(
    `${artifacts}/bundle-report.json`,
    `${JSON.stringify({ budget: BUDGET, baseline, buttonCard, incrementalGzip: incremental, everyExport: everything, stylesheet }, null, 2)}\n`,
  )
}

const over: string[] = []
if (incremental > BUDGET.buttonCardIncrementalGzip) {
  over.push(
    `Button/Card incremental JavaScript is ${kib(incremental)} gzip (budget ${kib(BUDGET.buttonCardIncrementalGzip)})`,
  )
}
if (stylesheet.gzip > BUDGET.stylesheetGzip) {
  over.push(`styles.css is ${kib(stylesheet.gzip)} gzip (budget ${kib(BUDGET.stylesheetGzip)})`)
}
if (over.length > 0) {
  for (const line of over) console.error(`over budget: ${line}`)
  process.exit(1)
}
