# Accessibility

The target is **WCAG 2.2 level AA** and the keyboard models of the
[ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/). This page records the decisions,
what the automated tests cover, and what has **not** been verified.

## Principles

1. **Native elements first.** Buttons are `<button>`, links are `<a href>`, inputs are native inputs,
   the dialog is `<dialog>`, the table is `<table>`. ARIA is added only where HTML has no element
   (tabs, combobox, menu, switch).
2. **The accessible name comes from visible text.** Every control takes a `label`; an icon-only
   button cannot be created without one (`SoraIconButton` requires `label`; the type tests check it).
3. **State is exposed, not only drawn.** `aria-invalid`, `aria-expanded`, `aria-selected`,
   `aria-current`, `aria-sort`, `aria-busy`, `aria-pressed` carry the state; colour is never the only
   signal (an icon, text, a border or a mark accompanies it).
4. **Relationships are wired by the component.** Labels, hints and errors are connected with
   `for` / `aria-describedby`, and merged with ids the caller passes.
5. **Nothing is announced that is not there, and live regions exist before their content.**

## Patterns

| Component                                                                                                    | Semantics                                                                                                          | Keyboard                                                                        |
| ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| `SoraButton`                                                                                                 | native button; `loading` is `aria-disabled` + `aria-busy`, keeps focus and label                                   | Enter, Space                                                                    |
| `SoraLink`                                                                                                   | native anchor; external links are named as such; a disabled link has no `href`                                     | Enter                                                                           |
| `SoraDialog`, `SoraDrawer`                                                                                   | `<dialog>.showModal()`: labelled by its title, described by its description; `alertdialog` on request              | Tab stays inside; Escape closes; focus returns to the opener                    |
| `SoraPopover`                                                                                                | non-modal; a titled panel is `role="dialog"`; trigger has `aria-expanded` / `aria-controls`                        | Enter/Space toggles; Escape closes and returns focus                            |
| `SoraDropdownMenu`                                                                                           | menu button, `role="menu"` / `menuitem`; disabled items stay focusable                                             | ArrowDown/Up open; arrows wrap; Home/End; typeahead; Enter; Escape; Tab         |
| `SoraTooltip`                                                                                                | `role="tooltip"` referenced by `aria-describedby`; supplementary text only                                         | appears on focus; Escape dismisses; stays while hovered                         |
| `SoraCombobox`                                                                                               | `role="combobox"` input, listbox popup, `aria-activedescendant`; results announced politely                        | type to filter; arrows; Enter; Escape closes, then clears; Alt+arrows           |
| `SoraTabs`                                                                                                   | `tablist` / `tab` / `tabpanel`; one tab stop                                                                       | arrows (follow direction and orientation); Home/End; manual activation optional |
| `SoraAccordion`                                                                                              | heading-wrapped buttons with `aria-expanded`; closed panels are `inert`                                            | Enter/Space; arrows, Home, End between headers                                  |
| `SoraPagination`                                                                                             | `nav` landmark; `aria-current="page"`; named buttons                                                               | Tab, Enter                                                                      |
| `SoraBreadcrumbs`                                                                                            | `nav` landmark with an ordered list; current page is not a link                                                    | Tab, Enter                                                                      |
| `SoraTable`                                                                                                  | real table with caption and header scopes; `aria-sort`; becomes a focusable labelled region only when it overflows | sort buttons; checkboxes; arrow keys scroll the region                          |
| `SoraCheckbox`, `SoraSwitch`, `SoraRadioGroup`, `SoraSelect`, `SoraSlider`, `SoraDateInput`, `SoraFileInput` | native controls; groups are `fieldset` / `legend`; the switch is a checkbox with `role="switch"`                   | native                                                                          |
| `SoraNumberInput`                                                                                            | native number input (a spin button); the optional stepper buttons are named and out of the Tab order               | type; ArrowUp/ArrowDown step (native)                                           |
| `SoraAlert`                                                                                                  | `role="alert"` for error/warning, `role="status"` otherwise, none for static notes                                 |                                                                                 |
| `SoraToastProvider`                                                                                          | labelled region with a persistent polite and a persistent assertive live region; every toast is dismissible        | toast buttons are in the Tab order; focus or hover pauses the timer             |
| `SoraFormErrorSummary`                                                                                       | labelled group of links to the fields; `role="alert"` only for form-level errors                                   | Enter moves focus to the field                                                  |
| `SoraProgress`, `SoraSpinner`, `SoraSkeleton`                                                                | native `<progress>`; `role="status"` with a name, or decorative on request                                         |                                                                                 |

The per-component pages in [docs/components](./components/README.md) carry the full notes.

## Cross-cutting behaviour

**Focus.** A visible focus indicator on every interactive element (`--sora-focus`, 2px, offset), drawn
with `:focus-visible`, and checked for 3:1 contrast against every surface in both schemes. Overlays
move focus in when they open and return it to the opener when they close; when the opener no longer
exists, focus goes to the closest focusable ancestor or to `returnFocus`. A modal dialog makes the
rest of the page inert natively, which is stronger than a scripted focus trap.

**Target size.** `--sora-hit-min` is `44px` under `@media (pointer: coarse)` and every interactive
control uses it as its minimum block size (and inline size where the content can be narrow). With a
fine pointer the compact density applies; targets then meet the 24px minimum of WCAG 2.2 (2.5.8) or
its spacing exception, which axe's `target-size` rule checks on every page.

**Motion.** Transitions are short (120ms and 160ms by default) and limited to opacity and a few
pixels of movement. `prefers-reduced-motion: reduce` sets every duration token to zero, as does
`motion: 'none'`; overlays then open and close immediately. Nothing waits for an animation to finish.

**Contrast.** Generated, not hoped for: see "Contrast is checked when the theme is generated" in
[theming.md](./theming.md).

**Forced colours.** Components keep a visible boundary, focus indicator and state mark in
`forced-colors: active` (system colours replace fills; selected and current states get an outline).

**Zoom and reflow.** Sizes are in `rem`; layouts wrap, and components adapt to their container with
container queries. Wide content (tables, tab lists) scrolls inside its own region instead of the page.

**Language and direction.** `SoraProvider` sets `lang` and `dir`; see [i18n.md](./i18n.md).

**Forms.** Errors are text, associated with their field, and appear after the field was left or the
form was submitted. A failed submission moves focus to the first invalid field and shows a summary
that links to every field. See [forms.md](./forms.md).

## What is tested automatically

| Check                                                                                                                                                                                                                     | Where                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| axe (WCAG 2.0/2.1/2.2 A and AA, best practices): every gallery page in light, dark and Arabic; the components page in Japanese with comfortable density; the forms page with errors shown; the overview at 200% text size | `tests/e2e/gallery/a11y.spec.ts`, `forms.spec.ts`, `preferences.spec.ts` |
| axe on the applications that installed the packed tarballs, light and dark                                                                                                                                                | `tests/e2e/consumer`                                                     |
| Keyboard flows: skip link, dialog, alert dialog, drawer, menu, popover, tooltip, combobox (local and asynchronous), tabs in both directions, overlays nested in a dialog, toasts                                          | `tests/e2e/gallery/keyboard.spec.ts`                                     |
| Roles, names, descriptions, states and focus movement of every component                                                                                                                                                  | `tests/browser/*.test.ts` (196+ tests)                                   |
| Reduced motion, forced colours, 44px targets with a coarse pointer, one `main` and one `h1` per page, `lang` and `dir`                                                                                                    | `tests/e2e/gallery/preferences.spec.ts`                                  |
| No horizontal page scrolling at 320, 375, 390, 768, 1024 and 1440px, also in Arabic and the pseudo-locale                                                                                                                 | `tests/e2e/gallery/responsive.spec.ts`                                   |
| Contrast of every token pair the components use, light and dark                                                                                                                                                           | `pnpm generate:theme` (364 checks)                                       |

Automated rules cover only a part of WCAG. A clean axe run means "no detectable violation", not
"accessible".

## What has not been verified

These need a person or an environment that was not available while this was built. They are open
items, not assumptions of success:

- **Screen readers.** No manual pass with NVDA, JAWS, VoiceOver (macOS or iOS) or TalkBack was
  performed. In particular the announcements of toasts, of combobox result counts, of validation
  errors and of the error summary are implemented to the specifications but have not been listened to.
- **Firefox and WebKit.** The E2E suite is written for all three engines and CI runs them, but only
  Chromium could be executed in the development environment.
- **Real high-contrast themes.** Forced colours were tested through Chromium's emulation, not on
  Windows with a contrast theme.
- **Touch and mobile assistive technology.** Target sizes were measured with Chromium's device
  emulation; no physical device was used.
- **Voice control and switch access** were not tested.

## Known limitations

- **Toasts and modal dialogs.** A modal dialog makes everything outside it inert, including the toast
  region. A toast raised while a dialog is open is painted above the backdrop but cannot be reached
  until the dialog closes. Use an inline `SoraAlert` for feedback inside a dialog.
- **Tooltips** are for supplementary text. They are not shown on touch and must not carry essential
  information.
- **Tab containment in dialogs is native.** Tab can move from the dialog to the browser's own
  interface and back, which is the platform behaviour for modal dialogs; it never reaches the page
  behind.
- **Anchor positioning.** In a browser without CSS anchor positioning, popups open but are not placed
  next to their trigger. See [compatibility.md](./compatibility.md).
- **`SoraDateInput` and `SoraFileInput`** rely on the browser's native pickers, whose accessibility
  differs between browsers and platforms.
