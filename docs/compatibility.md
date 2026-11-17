# Compatibility

What the library requires, what was verified, and the limitations that are known. Everything in the
"Verified" sections was actually run; the dates are 15 and 16 November 2026.

## Vue

- **Exactly `vue@3.6.0-rc.15`.** Vapor mode is a release candidate. Compiled Vapor output is tied to
  the runtime that executes it, so the peer dependency is an exact version, not a range. Moving to a
  newer Vue means rebuilding and re-running the whole verification, starting with
  `tests/browser/compat`.
- **Vapor applications.** The library is written for, and tested in, applications created with
  `createVaporApp`. Using the components inside a virtual-DOM application through Vue's interop
  plugin was **not tested** and is not claimed.
- **No server-side rendering claim.** Nothing was tested with SSR or hydration. Several components
  call browser APIs when they mount (`showModal()`, `showPopover()`, `ResizeObserver`), and
  generated ids are not coordinated between server and client.
- A bundler must resolve `vue` to its bundler entry (the one that re-exports the Vapor runtime) and
  compile Vapor SFCs: Vite with `@vitejs/plugin-vue` 6 does. In Node, `vue` resolves to its CommonJS
  build, which has no Vapor runtime; that is why components are tested only in browsers.

### The compatibility milestone

Before any component was written, a fixture proved each feature the components depend on, in a real
browser, as pure Vapor ([`tests/fixtures/compat`](../tests/fixtures/compat),
`tests/browser/compat`, 18 tests): reactive props with destructured defaults; default, named and
scoped slots; typed `defineModel`; `useTemplateRef` with `defineExpose`; attribute and listener
passthrough, conditional rendering and cleanup; Formisch field state with blur and submit validation
and an awaited submission; petite-vue-i18n locale switching; native dialog and popover lifecycles;
and the wrapper patterns (attribute routing, function refs, generic components, typed
provide/inject, dynamic elements). The same fixture was built with tsdown (JavaScript and
declarations) and consumed from a packed tarball.

## Browsers

The stylesheet and the overlays use current platform features without fallbacks or polyfills:

| Feature                                                                           | Used for                                                                          | Without it                                                                                                                  |
| --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| CSS anchor positioning (`anchor-name`, `position-area`, `position-try-fallbacks`) | placing popovers, menus, tooltips and the combobox list                           | popups open, but are not placed next to their trigger                                                                       |
| Popover API (`popover`, `showPopover()`)                                          | popovers, menus, tooltips, combobox, toasts                                       | those components do not work                                                                                                |
| `<dialog>.showModal()`, `closedby`                                                | dialog and modal sheet (`closedby` is optional: Escape is also handled in script) | dialog and sheet do not work                                                                                                |
| `light-dark()`, `color-mix()`, OKLCH                                              | every colour token                                                                | no colours                                                                                                                  |
| Cascade layers, CSS nesting, `:has()`, logical properties, container queries      | the whole stylesheet                                                              | broken layout                                                                                                               |
| `@starting-style`, `transition-behavior: allow-discrete`                          | entry and exit transitions of overlays                                            | overlays appear without a transition                                                                                        |
| `field-sizing: content`                                                           | auto-growing `SoraTextarea`                                                       | the textarea keeps its `rows` height                                                                                        |
| `<details name>`, `::details-content`, `interpolate-size`                         | the accordion (exclusive groups, animated height)                                 | items open without animation; without `name`, several can be open at once                                                   |
| `popover="hint"`, `popovertarget`                                                 | tooltips; native invokers for popovers and menus                                  | tooltips behave as manual popovers; triggers do not open their popover (every browser with anchor positioning has invokers) |
| Web Animations, `linear()` easing                                                 | sheets, springs                                                                   | sheets jump to their snap points                                                                                            |

In practice this means current Chromium-based browsers, and Firefox and Safari releases recent enough
to ship anchor positioning. Check the features above against your support matrix before adopting the
library; there is no legacy mode.

### Verified

- **Chromium** (Chrome for Testing 153, headless, Linux): the complete Vitest Browser Mode suite and
  the complete Playwright suite (gallery and packed consumers).

### Not verified

- **Firefox and WebKit.** The Playwright suite has projects for both and CI installs and runs them,
  but they could not be executed where this was developed (only a Chromium binary was available).
  Tests that depend on engine specifics are marked: Tab reaching buttons and links is an operating
  system setting in WebKit, forced colours are not implemented in WebKit, and coarse-pointer
  emulation needs Chromium.
- **Mobile browsers and real devices.**
- **Screen readers** and other assistive technology: see [accessibility.md](./accessibility.md).

## TypeScript

- The project is type-checked with the TypeScript 7.0.2 native engine through
  `typescript-native-bridge` (see [dependencies.md](./dependencies.md)). The published declarations
  are ordinary `.d.ts` files; `pnpm check:package` type-checks every entry standalone and
  `pnpm test:types` runs the type tests against them.
- Applications that use `vueCompilerOptions.strictTemplates` need
  `"dataAttributes": ["data-*"]` (so `data-*` attributes are accepted on components) and
  `"skipLibCheck": true` (Vue 3.6.0-rc.15's own declarations do not pass
  `exactOptionalPropertyTypes`).
- Declarations of Vapor SFCs describe components with a functional signature whose return type
  mentions `VNode`. That is how `vue-tsc` types every SFC; it says nothing about the runtime code.

## Known toolchain issues

Each of these was reproduced and has a workaround in the repository. They are tied to the pinned
versions and should be re-checked on every update.

1. **vue-tsc 3.3.14: `//` in a static attribute of a component in a Vapor SFC.** A template such as
   `<SoraLink href="https://example.com">` is mis-parsed by the template code generator
   (`@vue/language-core`), and unrelated identifiers in the template are then reported as
   "Cannot find name". The compiled output is correct; only the type check is affected.
   Workaround: keep such strings in `<script>` and bind them (`:href="url"`).
2. **vue-tsc types templates against the classic component instance.** In a Vapor template `$el`,
   `$refs`, `$parent` and `$root` type-check but are undefined at run time. `pnpm check:vapor`
   rejects them.
3. **`getCurrentInstance()` returns `null` in Vapor components.** Nothing in the library uses it
   (Oxlint bans the import); libraries that rely on it need checking. petite-vue-i18n's global scope
   works; the adapter uses only the instance's global composer.
4. **A component whose root is conditional (`v-if`) or a fragment** warns about "extraneous
   attributes" when it receives attributes while nothing is rendered. Such components bind `$attrs`
   explicitly (`SoraAlert`, `SoraFormErrorSummary`, `SoraToastProvider`, the overlays).
5. **Formisch 1.2.0 assigns errors to every field on any validation.** The forms integration decides
   when a field shows them (see [forms.md](./forms.md)). Formisch's own `Form` and `Field` components
   are virtual-DOM SFCs and are not used.
6. **A second copy of some `@vue/*` packages (3.5.45) is installed.** They are build-time internals
   of `vue-tsc` and `unplugin-vue`. `pnpm check:vapor` verifies that a production bundle contains one
   copy of each runtime package and no virtual-DOM renderer.

## Verified results

Measured on the commit this document belongs to (`pnpm build` first):

| Check                  | Result                                                                                                                                                                                                            |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm lint`            | Oxlint and Oxfmt clean                                                                                                                                                                                            |
| `pnpm typecheck`       | theme, ui, gallery, tests, unit, e2e and tooling projects pass                                                                                                                                                    |
| `pnpm check:vapor`     | 98 SFCs carry the marker and compile to `defineVaporComponent`; 74 built modules import no VDOM helper; the gallery's production graph (93 modules) has one copy of each Vue runtime package and no VDOM renderer |
| `pnpm check:locales`   | library 60 keys × 4 locales, gallery 293 keys × 4 locales                                                                                                                                                         |
| `pnpm test:unit`       | 76 tests pass                                                                                                                                                                                                     |
| `pnpm test:browser`    | 237 tests pass in Chromium (38 of them for the sheet)                                                                                                                                                             |
| `pnpm test:types`      | 40 negative cases hold against the sources and against the built declarations                                                                                                                                     |
| `pnpm test:e2e`        | Chromium: 62 gallery tests and 12 consumer tests pass; 5 opt-in visual tests skipped                                                                                                                              |
| `pnpm check:package`   | 59 export subpaths; 56 entries isolated; 57 declaration entries type-check standalone; publint clean                                                                                                              |
| `pnpm verify:consumer` | both applications install the tarballs, type-check, build and pass their browser tests                                                                                                                            |
| `pnpm measure:bundle`  | see below                                                                                                                                                                                                         |

### Bundle sizes

Measured by [`scripts/measure-bundle.ts`](../scripts/measure-bundle.ts): applications built with Vite
against the packed tarball, minified, gzip level 9.

| Measurement                                       | Minified   | gzip      | Budget       |
| ------------------------------------------------- | ---------- | --------- | ------------ |
| Baseline: Vue Vapor runtime, empty app            | 47.36 KiB  | 17.74 KiB |              |
| App with `SoraButton` and `SoraCard`              | 66.38 KiB  | 24.21 KiB |              |
| **Incremental cost of `SoraButton` + `SoraCard`** | 19.03 KiB  | 6.47 KiB  | under 10 KiB |
| Every core export, incremental                    | 140.55 KiB | 42.92 KiB |              |
| **`styles.css`**                                  | 81.39 KiB  | 12.85 KiB | under 35 KiB |

Both budgets are enforced by `pnpm measure:bundle`.
