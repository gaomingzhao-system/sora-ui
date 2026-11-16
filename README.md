# sora-ui

A compact Vue component library written entirely for **Vue Vapor mode**, with a warm, quiet visual
language: warm neutrals, thin borders, modest radii and small, purposeful motion.

| Package             | What it is                                                                       |
| ------------------- | -------------------------------------------------------------------------------- |
| `@your-scope/ui`    | 44 components, a Formisch forms integration, an i18n adapter, compiled CSS       |
| `@your-scope/theme` | The design-system configuration: palettes, `defineUiConfig`, CSS token generator |

`@your-scope` is a placeholder scope. `node scripts/set-scope.ts @your-real-scope` renames it
everywhere before the first publish.

- Every component is a `<script setup lang="ts" vapor>` SFC, compiled without the virtual DOM.
  `pnpm check:vapor` proves it for the sources, the built packages and a production bundle.
- Traditional API: props for behaviour and variants, `v-model` for state, named and scoped slots.
- Native platform first: `<dialog>`, the Popover API, CSS anchor positioning, native form controls.
- Works **without** Tailwind (one compiled stylesheet, no global reset) and **with** Tailwind v4.
- One editable file, [`ui.config.ts`](./ui.config.ts), defines the default design system.

## Requirements

| Tool    | Version                                                                |
| ------- | ---------------------------------------------------------------------- |
| Node.js | 26.13.1 (`.node-version`; `engines` accepts `>=26.13.1 <27`)           |
| pnpm    | 12.21.0 (pinned through `packageManager`)                              |
| Vue     | exactly `3.6.0-rc.15` (Vapor is a release candidate; see below)        |
| Browser | One that supports CSS anchor positioning, `popover` and `light-dark()` |

Everything else is pinned to exact versions in [`pnpm-workspace.yaml`](./pnpm-workspace.yaml) and
explained in [docs/dependencies.md](./docs/dependencies.md). Browser support and the known
limitations of the release-candidate toolchain are in [docs/compatibility.md](./docs/compatibility.md).

## Getting started

```bash
pnpm install
```

```bash
pnpm dev
```

`pnpm dev` generates the theme and starts the gallery, which shows every component, the foundations,
a validated profile form, a settings panel and a responsive workspace in light, dark, right-to-left
and a pseudo-locale.

The end-to-end and browser tests need browsers. Either install the ones Playwright pins:

```bash
pnpm exec playwright install --with-deps chromium firefox webkit
```

or, where a Chromium build already exists (containers, CI images), point the tests at it and limit
the E2E run to Chromium:

```bash
export VUI_CHROMIUM_PATH=/path/to/chromium VUI_E2E_BROWSERS=chromium
```

## Commands

| Command                | What it does                                                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `pnpm dev`             | Gallery dev server                                                                                                          |
| `pnpm generate:theme`  | `ui.config.ts` → generated CSS tokens and runtime defaults (fails on a contrast regression)                                 |
| `pnpm lint`            | Oxlint, then Oxfmt in check mode (`pnpm lint:fix` / `pnpm format` to apply)                                                 |
| `pnpm typecheck`       | `vue-tsc` over every project (TypeScript 7 engine through the bridge)                                                       |
| `pnpm check:vapor`     | Every SFC is Vapor: marker, compiled output, built packages, production module graph                                        |
| `pnpm check:locales`   | Key and placeholder parity for en, ja, ar and the pseudo-locale; every used key exists                                      |
| `pnpm test:unit`       | Vitest, Node: colour maths, theme resolver, internals, i18n, manifest                                                       |
| `pnpm test:browser`    | Vitest Browser Mode: every component in a real browser with the real stylesheet                                             |
| `pnpm build`           | Theme, packages (JS, declarations, CSS) and the gallery                                                                     |
| `pnpm test:types`      | Type tests with negative cases, against the sources and the built declarations                                              |
| `pnpm test:e2e`        | Playwright against the built gallery (and the packed consumers when present): axe, keyboard, forms, responsive, preferences |
| `pnpm check:package`   | Export map, tarball contents, optional-peer isolation, standalone declarations, publint                                     |
| `pnpm verify:consumer` | Packs the packages, installs the tarballs in two outside applications, type-checks, builds and tests them                   |
| `pnpm measure:bundle`  | Measured bundle sizes, enforced against the budgets                                                                         |
| `pnpm docs:components` | Regenerates [docs/components](./docs/components) from the sources (`--check` in CI)                                         |

CI runs all of them on every pull request, with Chromium, Firefox and WebKit for the end-to-end
tests; see [.github/workflows/ci.yml](./.github/workflows/ci.yml).

## Using the library

```bash
pnpm add @your-scope/ui vue@3.6.0-rc.15
```

```ts
// main.ts
import { createVaporApp } from 'vue'
import '@your-scope/ui/styles.css'
import App from './App.vue'

createVaporApp(App).mount('#app')
```

```vue
<script setup lang="ts" vapor>
import { ref } from 'vue'
import { UiButton, UiCard, UiInput } from '@your-scope/ui'

const name = ref('')
</script>

<template>
  <UiCard title="Profile" description="Visible to your team.">
    <UiInput v-model="name" label="Name" hint="As it appears on your profile." required />
    <template #footer>
      <UiButton variant="ghost" color="neutral">Cancel</UiButton>
      <UiButton type="submit">Save</UiButton>
    </template>
  </UiCard>
</template>
```

Your build must compile Vapor SFCs: with Vite, `@vitejs/plugin-vue` 6 does. The stylesheet follows
the page's own `color-scheme` and never resets host elements, so it is safe to add to an existing page.

| Topic                                   | Where                                                    |
| --------------------------------------- | -------------------------------------------------------- |
| Every component, prop, slot and example | [docs/components](./docs/components/README.md)           |
| Theming, tokens, dark mode, Tailwind    | [docs/theming.md](./docs/theming.md)                     |
| Forms with Formisch and Valibot         | [docs/forms.md](./docs/forms.md)                         |
| Translations and right-to-left          | [docs/i18n.md](./docs/i18n.md)                           |
| Accessibility decisions and test scope  | [docs/accessibility.md](./docs/accessibility.md)         |
| How the repository is put together      | [docs/architecture.md](./docs/architecture.md)           |
| Versions and why each dependency exists | [docs/dependencies.md](./docs/dependencies.md)           |
| Browser support and known limitations   | [docs/compatibility.md](./docs/compatibility.md)         |
| Publishing                              | [docs/release-checklist.md](./docs/release-checklist.md) |

### Type-checking an application

Applications that use `vueCompilerOptions.strictTemplates` need two settings: `data-*` attributes on
components must be allowed, and Vue's own declaration files do not pass `exactOptionalPropertyTypes`
at this release candidate.

```jsonc
{
  "compilerOptions": { "skipLibCheck": true },
  "vueCompilerOptions": { "strictTemplates": true, "dataAttributes": ["data-*"] },
}
```

## Repository layout

```text
ui.config.ts               the design-system configuration (single source of truth)
packages/theme             palettes, defineUiConfig, token resolver, contrast audit
packages/ui                components, forms, i18n, styles, component manifest
apps/gallery               Vapor + Tailwind host that demonstrates everything
apps/consumer              outside application used by verify:consumer (no Tailwind)
tests/unit                 Node tests
tests/browser              Vitest Browser Mode tests and their harness components
tests/types                type tests (must-compile and must-not-compile cases)
tests/e2e                  Playwright tests for the gallery and the packed consumers
tests/fixtures             Vapor compatibility fixtures and the Button/Card-only consumer
scripts                    theme generation, builds, checks, measurements
docs                       documentation; docs/components is generated
```

## Status

The library targets a release candidate of Vue. It does not claim server-side rendering support:
nothing here was tested with SSR or hydration. What was and was not verified, including checks that
need a person (screen readers) or other browser engines, is listed in
[docs/compatibility.md](./docs/compatibility.md) and [docs/accessibility.md](./docs/accessibility.md).

## License

[MIT](./LICENSE)
