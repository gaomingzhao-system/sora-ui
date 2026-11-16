# Theming

## One file defines the design system

[`ui.config.ts`](../ui.config.ts) at the repository root is the single editable source of the default
design system:

```ts
import { defineUiConfig } from '@your-scope/theme'

export default defineUiConfig({
  colors: {
    primary: 'neutral',
    secondary: 'terracotta',
    success: 'green',
    info: 'blue',
    warning: 'amber',
    error: 'red',
    neutral: 'taupe',
  },
  density: 'compact',
  radius: 'md',
  motion: 'subtle',
  defaults: {
    button: { size: 'md', variant: 'solid', color: 'primary' },
    card: { padding: 'md', variant: 'outline' },
  },
})
```

`pnpm generate:theme` (also the first step of `pnpm dev` and `pnpm build`) turns it into

- `packages/ui/src/styles/theme.generated.css`: the `--vui-*` tokens of the shipped stylesheet, and
- `packages/ui/src/config.generated.ts`: the runtime prop defaults,

with the **same resolver** that the runtime helpers use, so the generated stylesheet and a runtime
override can never disagree. Changing a value there changes the shipped design system without
touching a component.

### Options

| Key         | Values                                                                                                           | Default           |
| ----------- | ---------------------------------------------------------------------------------------------------------------- | ----------------- |
| `colors`    | one palette name per role (see below)                                                                            | as shown above    |
| `palettes`  | extra palettes that `colors` may name                                                                            | none              |
| `colorMode` | `'inherit' \| 'light' \| 'dark' \| 'system'`                                                                     | `'inherit'`       |
| `density`   | `'compact' \| 'comfortable'`                                                                                     | `'compact'`       |
| `radius`    | `'none' \| 'sm' \| 'md' \| 'lg'`                                                                                 | `'md'`            |
| `motion`    | `'none' \| 'subtle' \| 'standard'`                                                                               | `'subtle'`        |
| `fonts`     | `sans`, `serif`, `mono` stacks and `display: 'sans' \| 'serif'`                                                  | system stacks     |
| `defaults`  | prop defaults for `button`, `iconButton`, `link`, `card`, `badge`, `alert`, `avatar`, `control`, `tabs`, `table` | see `defaults.ts` |
| `tokens`    | raw `--vui-*` overrides: `both`, `light`, `dark`                                                                 | none              |

### Colours name palettes, not roles

The seven roles are `primary`, `secondary`, `success`, `info`, `warning`, `error` and `neutral`. Each
value names a **palette**: `primary: 'neutral'` selects the neutral (near-grey) palette for the
primary role and has nothing to do with the `neutral` role, which uses `taupe` by default.

Built-in palettes: `neutral`, `taupe`, `terracotta`, `green`, `blue`, `amber`, `red`, `violet`,
`teal`. Each is an eleven-step OKLCH scale (50 to 950). A custom palette is declared and then named:

```ts
import { createPalette, defineUiConfig } from '@your-scope/theme'

export default defineUiConfig({
  palettes: { brand: createPalette({ hue: 250, chroma: 0.12 }) },
  colors: { primary: 'brand' },
})
```

`defineUiConfig` is typed: a value that is neither a built-in palette nor a key of `palettes` does
not compile, and `normalizeUiConfig` throws for it at run time with the list of known palettes.

### Contrast is checked when the theme is generated

For both schemes the generator measures every text/surface combination the components use: body,
muted and subtle text on each of the four surfaces; the label on each role's fill at rest, on hover
and when pressed; each role's readable text on every surface and on its soft fills; and the strong
border, the role fills and borders and the focus ring against every surface. Text needs 4.5:1,
non-text boundaries 3:1 (WCAG 2.2 AA). That is 364 checks for the default configuration. A failing
pair fails `pnpm generate:theme`, so a palette change cannot silently ship unreadable text. The
gallery's Foundations page shows the count.

## Tokens

Everything visual is a custom property with the `--vui-` prefix in `@layer theme.vui`.

| Group      | Examples                                                                                                                               |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Surfaces   | `--vui-canvas`, `--vui-surface`, `--vui-elevated`, `--vui-subtle`, `--vui-inverted`                                                    |
| Text       | `--vui-text`, `--vui-text-muted`, `--vui-text-subtle`, `--vui-text-inverted`                                                           |
| Boundaries | `--vui-border`, `--vui-border-strong`, `--vui-focus`, `--vui-focus-width`, `--vui-focus-offset`                                        |
| Intents    | per role: `--vui-<role>` (and `-hover`, `-active`), `--vui-on-<role>`, `--vui-<role>-text`, `--vui-<role>-soft`, `--vui-<role>-border` |
| States     | `--vui-hover`, `--vui-pressed`, `--vui-disabled-opacity`                                                                               |
| Density    | `--vui-control-sm\|md\|lg`, `--vui-gap-*`, `--vui-pad-*`, `--vui-row`, `--vui-hit-min`                                                 |
| Shape      | `--vui-radius-sm\|md\|lg`, `--vui-border-width`                                                                                        |
| Type       | `--vui-font-sans\|serif\|mono\|display`, `--vui-text-xs` … `--vui-text-2xl`, `--vui-leading-*`, `--vui-weight-*`                       |
| Elevation  | `--vui-shadow-sm\|md\|lg`                                                                                                              |
| Motion     | `--vui-duration-fast`, `--vui-duration-overlay`, `--vui-ease-out`, `--vui-ease-in-out`                                                 |

Colours are `light-dark()` pairs, so one set of declarations serves both schemes. `--vui-hit-min` is
`0px` for fine pointers and `2.75rem` (44 CSS px) under `@media (pointer: coarse)`; every interactive
control uses it as its minimum size.

## Light and dark

The default colour mode is `inherit`: the stylesheet follows the page's own `color-scheme` and never
sets one, so adding the library to a light-only page does not turn it dark for users whose system is
dark. To opt in:

```css
/* follow the operating system */
:root {
  color-scheme: light dark;
}
```

or use the provider, which sets `data-vui-theme` (and with it `color-scheme`) for a subtree or for
the document:

```vue
<UiProvider target="document" color-mode="system">…</UiProvider>
<UiProvider color-mode="dark">always dark, whatever surrounds it</UiProvider>
```

## Scoped overrides with `UiProvider`

`UiProvider` changes scheme, density, radius, motion, direction, locale, tokens and prop defaults for
a subtree. Providers nest and merge; only what a provider mentions is overridden.

```vue
<script setup lang="ts" vapor>
import { UiButton, UiProvider } from '@your-scope/ui'
import { createProviderTheme } from '@your-scope/ui/theme'

// A partial ui.config.ts-style object, resolved by the same resolver as the generated stylesheet.
const brand = createProviderTheme({ colors: { primary: 'violet' }, radius: 'lg' })
</script>

<template>
  <UiProvider v-bind="brand" :defaults="{ button: { size: 'lg' } }">
    <UiButton>Violet, large, rounder</UiButton>
  </UiProvider>
</template>
```

| Prop                          | Effect                                                                                                                       |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `colorMode`                   | `light`, `dark` or `system` for the subtree                                                                                  |
| `density`, `radius`, `motion` | switch the corresponding token group                                                                                         |
| `themeVars`                   | raw `--vui-*` overrides (what `createThemeVars()` / `createProviderTheme()` return)                                          |
| `defaults`                    | component prop defaults, merged over the outer provider's                                                                    |
| `locale`, `dir`, `translator` | language, direction and messages (see [i18n.md](./i18n.md))                                                                  |
| `target`                      | `self` (default) renders a `display: contents` wrapper; `document` applies everything to `<html>` and restores it on unmount |
| `as`                          | wrapper element for `target="self"`                                                                                          |

Resolution order for a prop such as a button's `size`: explicit prop, nearest provider `defaults`,
outer providers, `ui.config.ts`.

`@your-scope/ui/theme` is an optional entry: the palettes and the resolver are only bundled by
applications that override colours at run time.

## Plain CSS overrides

All library rules are in cascade layers, so ordinary application CSS wins without `!important`:

```css
/* a token, globally or for a subtree */
:root {
  --vui-radius-md: 0.25rem;
}
.checkout {
  --vui-primary: light-dark(oklch(45% 0.15 250), oklch(80% 0.1 250));
}

/* a part of a component */
.vui-button.cta {
  min-inline-size: 12rem;
}
```

The stable styling hooks of each component (root class, part classes, `data-*` attributes) are listed
under "Styling" on its page in [docs/components](./components/README.md).

## With Tailwind CSS v4

```css
@import 'tailwindcss';
@import '@your-scope/ui/styles.css';
@import '@your-scope/ui/tailwind.css';
```

- The import order does not matter: the library's rules live in sub-layers of Tailwind's canonical
  layers, so your utilities always override component styles and your Preflight never undoes them.
- `tailwind.css` maps the tokens into your theme under `vui-` names with `@theme inline`, so the
  utilities reference the live custom properties and follow dark mode and nested providers:
  `bg-vui-surface`, `text-vui-muted`, `border-vui-border`, `rounded-vui`, `shadow-vui-md`,
  `font-vui-display`, `text-vui-sm`.
- It adds the variants `vui-invalid:`, `vui-busy:`, `vui-coarse:` and `vui-scheme-dark:`, the
  `vui-focus-ring` utility and the `duration-vui-fast` / `duration-vui-overlay` utilities.
- It does not redefine any key of your theme and emits no CSS on its own.

The gallery ([`apps/gallery/src/styles.css`](../apps/gallery/src/styles.css)) is a working host.

## Without Tailwind

Import `@your-scope/ui/styles.css` and nothing else. The compiled file contains no Tailwind runtime,
no `--tw-*` variables, no utility classes and no global reset; `pnpm verify:consumer` builds and
tests two applications this way. Measured size: 70.12 KiB, 11.23 KiB gzip.
