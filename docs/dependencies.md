# Dependencies

Every version below is **exact** (no ranges), was confirmed to exist on the npm registry on
15 November 2026, and is installed from the committed `pnpm-lock.yaml`. The versions live in one
place, the `catalog` of [`pnpm-workspace.yaml`](../pnpm-workspace.yaml); package manifests refer to
them with `catalog:`.

## Runtime

| Tool    | Version | Pinned in                                             |
| ------- | ------- | ----------------------------------------------------- |
| Node.js | 26.13.1 | `.node-version`, `engines.node` (`>=26.13.1 <27`), CI |
| pnpm    | 12.21.0 | `packageManager` (`pnpm@12.21.0`), `engines.pnpm`     |

Scripts are TypeScript files run directly by Node (`node scripts/x.ts`, type stripping), so there is
no script runner dependency. The sources use only erasable syntax (`erasableSyntaxOnly`).

## What the published packages depend on

| Package             | Kind               | Version       | Why                                                                                                                            |
| ------------------- | ------------------ | ------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `vue`               | peer of `ui`       | `3.6.0-rc.15` | The Vapor runtime. Exact, because Vapor is a release candidate and its compiled output is tied to the runtime that executes it |
| `@your-scope/theme` | dependency of `ui` | workspace     | Only reached from `@your-scope/ui/theme`                                                                                       |
| `@formisch/vue`     | optional peer      | `^1.2.0`      | Form state, used only by `@your-scope/ui/forms`                                                                                |
| `valibot`           | optional peer      | `^1.5.0`      | Schemas for Formisch                                                                                                           |
| `petite-vue-i18n`   | optional peer      | `^11.4.20`    | Used only by `@your-scope/ui/i18n`                                                                                             |

`@your-scope/theme` has no dependencies. The optional peers are ranges on purpose (a library must
not force an exact version of an application's form or i18n library); the workspace itself installs
the exact versions below.

## Development dependencies

| Package                      | Version                                               | Role                                                                           |
| ---------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------ |
| `vue`                        | 3.6.0-rc.15                                           | Runtime under test                                                             |
| `@vue/compiler-sfc`          | 3.6.0-rc.15                                           | Same line as `vue`; also used directly by `check:vapor` and the docs generator |
| `typescript`                 | `typescript-native-bridge@6.0.3-bridge.19.tsgo.7.0.2` | TypeScript 7.0.2 engine behind the classic compiler API (see below)            |
| `vue-tsc`                    | 3.3.14                                                | Type-checks SFCs and templates                                                 |
| `vite`                       | 8.3.8                                                 | Gallery, consumers, Vitest                                                     |
| `@vitejs/plugin-vue`         | 6.0.11                                                | Compiles Vapor SFCs in Vite                                                    |
| `tsdown`                     | 0.23.7                                                | Library bundler (Rolldown) and declaration build                               |
| `unplugin-vue`               | 8.0.1                                                 | Compiles Vapor SFCs in tsdown                                                  |
| `tailwindcss`                | 4.3.5                                                 | CSS compiler for the library; host framework in the gallery                    |
| `@tailwindcss/cli`           | 4.3.5                                                 | Builds `dist/styles.css`                                                       |
| `@tailwindcss/vite`          | 4.3.5                                                 | Tailwind in the gallery and the browser tests                                  |
| `vitest`                     | 5.1.0                                                 | Unit tests and Browser Mode                                                    |
| `@vitest/browser-playwright` | 5.1.0                                                 | Browser Mode provider                                                          |
| `playwright`                 | 1.65.1                                                | Browser automation for Browser Mode                                            |
| `@playwright/test`           | 1.65.1                                                | End-to-end tests                                                               |
| `@axe-core/playwright`       | 4.14.0                                                | Automated accessibility checks in the E2E tests                                |
| `@formisch/vue`              | 1.2.0                                                 | Forms integration and its tests                                                |
| `valibot`                    | 1.5.0                                                 | Schemas in the gallery and tests                                               |
| `petite-vue-i18n`            | 11.4.20                                               | i18n adapter, gallery, consumer                                                |
| `@intlify/message-compiler`  | 11.4.20                                               | Build-time precompilation of locale messages (same line as petite-vue-i18n)    |
| `oxlint`                     | 1.93.0                                                | Linter (`.oxlintrc.json`)                                                      |
| `oxfmt`                      | 0.78.0                                                | Formatter (`.oxfmtrc.json`)                                                    |
| `publint`                    | 0.3.25                                                | Package-metadata lint in `check:package`                                       |
| `@changesets/cli`            | 3.0.3                                                 | Versioning and changelogs                                                      |
| `@types/node`                | 26.6.6                                                | Types for the scripts                                                          |

The consumer applications (`apps/consumer`, `tests/fixtures/consumer-basic`) pin the same versions in
their own manifests, because they are installed outside the workspace.

## TypeScript 7 and the bridge

The project type-checks and emits declarations with the **TypeScript 7.0.2 native engine**. Two tools
in the chain, `vue-tsc` (Volar) and tsdown's `tsc` declaration generator, still call the classic
JavaScript compiler API, which the native engine does not expose on its own.
`typescript-native-bridge@6.0.3-bridge.19.tsgo.7.0.2` provides that API on top of the native engine.
Reading its version: `6.0.3` is the classic API level it presents, `bridge.19` the bridge build and
`tsgo.7.0.2` the engine.

- The catalog maps `typescript` to the bridge, and an `overrides` entry does the same for every
  transitive `typescript` (vue-tsc, tsdown's declaration plugin, Valibot's optional peer), so there
  is exactly one compiler in the graph.
- `tsc --version` prints `6.0.3` (the API level). Under `vue-tsc` the bridge prints a one-line
  `TNB ACTIVE` banner, which the project's scripts filter out of their reports.
- An application that consumes the library does not need the bridge. The packed consumers use it only
  because they run `vue-tsc` with the same pinned toolchain.

## Linting and formatting

Oxlint and Oxfmt are the only lint and format tools.

- [`.oxlintrc.json`](../.oxlintrc.json): the `typescript`, `unicorn`, `oxc`, `import`, `promise` and
  `vue` plugins (plus `vitest` for the tests) with the `correctness`, `suspicious` and `perf`
  categories as errors. `no-restricted-imports` bans the virtual-DOM and instance APIs of `vue`
  (`h`, `createVNode`, `cloneVNode`, `createApp`, `createSSRApp`, `defineComponent`,
  `getCurrentInstance`, `render`, `resolveComponent`, `vaporInteropPlugin`). Type imports,
  `no-explicit-any`, `no-non-null-assertion`, import cycles and type-based `defineProps` /
  `defineEmits` are enforced as well. Scripts and tests relax `no-console` and `no-await-in-loop`
  through `overrides`.
- [`.oxfmtrc.json`](../.oxfmtrc.json): 110 columns, single quotes, no semicolons, trailing commas.
  It formats TypeScript, Vue SFCs, CSS, JSON and Markdown; generated files (`*.generated.*`,
  `docs/components`) and the lockfile are excluded.
- `pnpm lint` runs `oxlint && oxfmt --check`; `pnpm lint:fix` and `pnpm format` apply fixes.

## pnpm settings

pnpm 12 reads its settings from `pnpm-workspace.yaml`:

- `packages`: `packages/*` and `apps/gallery`. The consumers are deliberately not members.
- `catalog`: the versions above.
- `overrides`: `typescript` → the bridge.
- `allowBuilds`: dependency build scripts are denied by default. `@parcel/watcher` (pulled in by the
  Tailwind CLI for watch mode) is listed as `false`: it ships prebuilt binaries and its from-source
  fallback is not needed.

## Notable transitive packages

- `@vue/compiler-core`, `@vue/compiler-dom`, `@vue/shared` and `@vue/reactivity` **3.5.45** are also
  in the tree. They are internal dependencies of `vue-tsc` (`@vue/language-core`) and `unplugin-vue`
  and run at build time only; `check:vapor` verifies that a production bundle contains exactly one
  copy of each runtime package, all from 3.6.0-rc.15.
- Formisch's own `Form` and `Field` components (virtual-DOM SFCs) are part of `@formisch/vue` but are
  never imported; `check:vapor` verifies that they are tree-shaken out of the gallery bundle.

## Updating

1. Change the version in the `catalog` (and in the two consumer manifests).
2. `pnpm install`, then run the whole command list in the README. `tests/browser/compat` is the
   quickest signal for a Vue, compiler or plugin update: it exercises each Vapor feature the
   components rely on.
3. Re-read [compatibility.md](./compatibility.md): several notes there are tied to specific versions
   and should be removed once the upstream issue is gone.
