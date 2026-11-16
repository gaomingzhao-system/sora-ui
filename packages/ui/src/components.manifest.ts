/**
 * The component catalogue.
 *
 * This manifest is the single list of public components. It drives
 *   - the per-component build entries (tsdown.config.ts),
 *   - the explicit `exports` map (scripts/sync-exports.ts, verified by check:package),
 *   - the generated reference in docs/components (scripts/generate-docs.ts),
 *   - the gallery's catalogue page, and
 *   - the Vapor check (every `source` must compile in Vapor mode).
 *
 * Plain data only: it is imported by Node scripts as well as by the browser.
 */
export type SoraComponentCategory =
  | 'foundation'
  | 'actions'
  | 'display'
  | 'feedback'
  | 'inputs'
  | 'forms'
  | 'overlays'
  | 'navigation'
  | 'data'

export interface SoraComponentManifestEntry {
  /** Exported component name. */
  readonly name: string
  readonly category: SoraComponentCategory
  /** Source file, relative to `packages/ui/src`. */
  readonly source: string
  /** Public entry that exports the component. */
  readonly entry: 'core' | 'forms'
  /** What the component is for (one sentence). */
  readonly summary: string
  /** Where attributes that are not props end up. */
  readonly attrs: string
  /** Keyboard interaction. Empty when the component is not interactive. */
  readonly keyboard: readonly string[]
  /** Semantics and accessibility decisions. */
  readonly a11y: readonly string[]
  /** Root class, part classes and tokens intended for customisation. */
  readonly styling: readonly string[]
}

const component = (entry: SoraComponentManifestEntry): SoraComponentManifestEntry => Object.freeze(entry)

const FIELD_PARTS = '`.sora-field`, `.sora-field__label`, `.sora-field__hint`, `.sora-field__error`'
const CONTROL_ATTRS =
  'class/style go to the root; every other attribute and listener (and `controlAttrs`) goes to the native control.'

export const componentManifest: readonly SoraComponentManifestEntry[] = Object.freeze([
  // ------------------------------------------------------------- foundation
  component({
    name: 'SoraProvider',
    category: 'foundation',
    source: 'components/foundation/SoraProvider.vue',
    entry: 'core',
    summary:
      'Scopes colour scheme, density, radius, motion, direction, locale, translator, token overrides and component defaults for a subtree.',
    attrs:
      'The wrapper element (`target="self"`). With `target="document"` nothing is rendered and attributes are ignored.',
    keyboard: [],
    a11y: [
      'Sets `dir` and `lang` on its wrapper (or on `<html>`), so native controls, hyphenation and assistive technology follow the locale.',
      'The wrapper is `display: contents`: it adds no box and no landmark.',
      'Overlays stay inside the provider in the DOM (native top layer), so they inherit its tokens and direction.',
    ],
    styling: [
      '`.sora-provider`',
      '`data-sora-theme`, `data-sora-density`, `data-sora-radius`, `data-sora-motion`',
      'any `--sora-*` token through `themeVars`',
    ],
  }),
  component({
    name: 'SoraIcon',
    category: 'foundation',
    source: 'components/foundation/SoraIcon.vue',
    entry: 'core',
    summary: 'Renders trusted, static SVG path data as a decorative or a named icon.',
    attrs: 'The `<svg>` element.',
    keyboard: [],
    a11y: [
      'Without `label` the icon is `aria-hidden`; with `label` it is `role="img"` with that name.',
      'Only glyphs marked `directional` mirror in right-to-left text.',
      'Path data comes from static definitions; nothing is injected with `v-html`.',
    ],
    styling: [
      '`.sora-icon`',
      'inherits `color` (`currentColor`) and scales with `font-size` unless `size` is set',
    ],
  }),

  // ---------------------------------------------------------------- actions
  component({
    name: 'SoraButton',
    category: 'actions',
    source: 'components/actions/SoraButton.vue',
    entry: 'core',
    summary: 'Triggers an action. A native `<button>` with variants, intents, sizes and a loading state.',
    attrs: 'The native `<button>` (including `class`, `style`, `name`, `form`, `aria-*` and listeners).',
    keyboard: [
      'Enter or Space activates (native).',
      'While `loading`, activation is ignored but the button stays focusable.',
    ],
    a11y: [
      '`type` defaults to `button`, so it never submits a form by accident.',
      '`disabled` uses the native attribute. `loading` uses `aria-disabled` + `aria-busy`, keeps the label in the accessibility tree and keeps focus.',
      'Hover styles apply only on devices that can hover; the focus ring uses `:focus-visible`.',
    ],
    styling: [
      '`.sora-button`, `.sora-button__label`, `.sora-button__icon`, `.sora-button__spinner`',
      '`data-variant`, `data-color`, `data-size`, `data-block`, `data-loading`',
    ],
  }),
  component({
    name: 'SoraIconButton',
    category: 'actions',
    source: 'components/actions/SoraIconButton.vue',
    entry: 'core',
    summary: 'A square button that shows only an icon and therefore requires an accessible name.',
    attrs: 'The native `<button>` (through SoraButton).',
    keyboard: ['Enter or Space activates (native).'],
    a11y: [
      '`label` is required and becomes `aria-label`.',
      'The icon is decorative.',
      'Coarse pointers get a 44px hit area.',
    ],
    styling: ['`.sora-button.sora-icon-button`', '`data-variant`, `data-color`, `data-size`'],
  }),
  component({
    name: 'SoraButtonGroup',
    category: 'actions',
    source: 'components/actions/SoraButtonGroup.vue',
    entry: 'core',
    summary:
      'Groups related buttons, optionally joined into one segmented control, and gives them shared defaults.',
    attrs: 'The group `<div role="group">`.',
    keyboard: ['Each button is a normal tab stop (a group is not a toolbar).'],
    a11y: ['`role="group"` with `aria-label` from `label` (or pass `aria-labelledby`).'],
    styling: ['`.sora-button-group`', '`data-orientation`, `data-attached`'],
  }),
  component({
    name: 'SoraLink',
    category: 'actions',
    source: 'components/actions/SoraLink.vue',
    entry: 'core',
    summary: 'Navigates. Always a real `<a>`; use SoraButton for actions.',
    attrs: 'The `<a>` element.',
    keyboard: ['Enter follows the link (native).'],
    a11y: [
      'Underlined by default so it is not identified by colour alone.',
      '`external` adds `target="_blank" rel="noopener noreferrer"` and a visually hidden "opens in a new tab".',
      '`disabled` removes `href` and sets `role="link" aria-disabled="true"`.',
    ],
    styling: ['`.sora-link`, `.sora-link__icon`', '`data-color`, `data-underline`'],
  }),

  // ---------------------------------------------------------------- display
  component({
    name: 'SoraCard',
    category: 'display',
    source: 'components/display/SoraCard.vue',
    entry: 'core',
    summary: 'A compact surface with header, body, footer and actions slots.',
    attrs: 'The root element (`as`, default `<div>`).',
    keyboard: [],
    a11y: [
      '`title` renders a real heading (`headingLevel`).',
      'With `as="section"`/`"article"` the root is labelled by the title.',
      'The card is an inline-size container: narrow cards stack their footer buttons.',
    ],
    styling: [
      '`.sora-card`, `.sora-card__header`, `.sora-card__title`, `.sora-card__description`, `.sora-card__actions`, `.sora-card__body`, `.sora-card__footer`',
      '`data-variant`, `data-padding`',
      '`--sora-card-min`',
    ],
  }),
  component({
    name: 'SoraBadge',
    category: 'display',
    source: 'components/display/SoraBadge.vue',
    entry: 'core',
    summary: 'A short status or category label.',
    attrs: 'The `<span>` element.',
    keyboard: [],
    a11y: ['Purely visual: the text carries the meaning; the optional dot is decorative.'],
    styling: ['`.sora-badge`, `.sora-badge__dot`', '`data-variant`, `data-color`, `data-size`'],
  }),
  component({
    name: 'SoraAvatar',
    category: 'display',
    source: 'components/display/SoraAvatar.vue',
    entry: 'core',
    summary: 'Shows a person or entity as an image, falling back to initials and then to a generic glyph.',
    attrs: 'The root `<span>`.',
    keyboard: [],
    a11y: [
      'The image uses `name` as `alt`.',
      'When the fallback shows, the root is `role="img"` named by `name`.',
      'A failed image load switches to the fallback automatically.',
    ],
    styling: ['`.sora-avatar`, `.sora-avatar__image`, `.sora-avatar__initials`', '`data-size`, `data-shape`'],
  }),
  component({
    name: 'SoraAvatarGroup',
    category: 'display',
    source: 'components/display/SoraAvatarGroup.vue',
    entry: 'core',
    summary: 'A row of overlapping avatars from a typed array, with a counter for the remainder.',
    attrs: 'The `<ul>` element.',
    keyboard: [],
    a11y: [
      'A list (`<ul>`/`<li>`), optionally named with `label`.',
      'The "+N" counter has a translated text alternative.',
    ],
    styling: [
      '`.sora-avatar-group`, `.sora-avatar-group__item`, `.sora-avatar-group__more`',
      '`--sora-on-surface` (ring colour)',
    ],
  }),
  component({
    name: 'SoraSeparator',
    category: 'display',
    source: 'components/display/SoraSeparator.vue',
    entry: 'core',
    summary: 'A horizontal or vertical dividing line, optionally with a centred label.',
    attrs: 'The root `<div>`.',
    keyboard: [],
    a11y: [
      'Decorative by default (`role="none"`).',
      '`decorative=false` renders `role="separator"` with `aria-orientation`.',
    ],
    styling: ['`.sora-separator`, `.sora-separator__label`', '`data-orientation`'],
  }),
  component({
    name: 'SoraKbd',
    category: 'display',
    source: 'components/display/SoraKbd.vue',
    entry: 'core',
    summary: 'Displays a key or a keyboard shortcut.',
    attrs: 'The `<kbd>` element.',
    keyboard: [],
    a11y: ['Uses `<kbd>`; a shortcut nests one `<kbd>` per key, as HTML recommends.'],
    styling: ['`.sora-kbd`, `.sora-kbd-combo`', '`data-size`'],
  }),
  component({
    name: 'SoraEmptyState',
    category: 'display',
    source: 'components/display/SoraEmptyState.vue',
    entry: 'core',
    summary: 'Explains that there is nothing to show yet and what to do next.',
    attrs: 'The root `<div>`.',
    keyboard: [],
    a11y: ['The title is a real heading (`headingLevel`).', 'The glyph is decorative.'],
    styling: [
      '`.sora-empty-state`, `.sora-empty-state__icon`, `.sora-empty-state__title`, `.sora-empty-state__description`, `.sora-empty-state__actions`',
      '`data-size`',
    ],
  }),

  // --------------------------------------------------------------- feedback
  component({
    name: 'SoraAlert',
    category: 'feedback',
    source: 'components/feedback/SoraAlert.vue',
    entry: 'core',
    summary: 'An inline message with an intent, optional title, actions and dismissal.',
    attrs: 'The root `<div>`.',
    keyboard: ['The dismiss button is a normal button (Enter/Space).'],
    a11y: [
      '`announce="auto"`: `role="alert"` for error/warning, `role="status"` otherwise; `off` renders a static note.',
      'Intent is conveyed by the title/text and an icon, not by colour alone.',
      'The dismiss button has a translated accessible name.',
    ],
    styling: [
      '`.sora-alert`, `.sora-alert__icon`, `.sora-alert__title`, `.sora-alert__description`, `.sora-alert__actions`',
      '`data-color`, `data-variant`',
    ],
  }),
  component({
    name: 'SoraSpinner',
    category: 'feedback',
    source: 'components/feedback/SoraSpinner.vue',
    entry: 'core',
    summary: 'An indeterminate activity indicator.',
    attrs: 'The root `<span>`.',
    keyboard: [],
    a11y: [
      '`role="status"` with a translated (or custom) label.',
      '`decorative` hides it when another element already reports the busy state.',
      'With reduced motion the ring stops spinning; the status text remains.',
    ],
    styling: ['`.sora-spinner`, `.sora-spinner__ring`', '`data-size`', 'inherits `color`'],
  }),
  component({
    name: 'SoraProgress',
    category: 'feedback',
    source: 'components/feedback/SoraProgress.vue',
    entry: 'core',
    summary: 'Determinate or indeterminate progress built on the native `<progress>` element.',
    attrs: 'The root `<div>`.',
    keyboard: [],
    a11y: [
      'Native `<progress>`; omitting `value` makes it indeterminate.',
      'Named by the visible `label`, or by a translated default.',
      '`aria-valuetext` carries the locale-formatted percentage.',
    ],
    styling: [
      '`.sora-progress`, `.sora-progress__bar`, `.sora-progress__label`, `.sora-progress__value`',
      '`data-size`, `data-color`',
    ],
  }),
  component({
    name: 'SoraSkeleton',
    category: 'feedback',
    source: 'components/feedback/SoraSkeleton.vue',
    entry: 'core',
    summary: 'A placeholder shape shown while content loads.',
    attrs: 'The root `<span>`.',
    keyboard: [],
    a11y: [
      'Decorative (`aria-hidden`) by default; mark the loading region with `aria-busy`.',
      '`announce` renders a polite status instead.',
      'The shimmer stops with reduced motion.',
    ],
    styling: ['`.sora-skeleton`, `.sora-skeleton__block`', '`data-shape`'],
  }),
  component({
    name: 'SoraToastProvider',
    category: 'feedback',
    source: 'components/feedback/SoraToastProvider.vue',
    entry: 'core',
    summary: 'Hosts the queue of dismissible notifications that `useToast()` adds to.',
    attrs: 'The notification region (`<section>`); the slot content is rendered next to it, unwrapped.',
    keyboard: [
      'Toast buttons are ordinary buttons in the page tab order.',
      'Focus or hover inside the region pauses auto-dismissal.',
    ],
    a11y: [
      'A labelled region with two persistent live regions: polite (`role="status"`) and assertive (`role="alert"`, for `urgent` toasts).',
      'Every toast has a dismiss button; `duration: 0` keeps it until dismissed.',
      'The region is a manual popover in the top layer; while a modal dialog is open it is inert, so use an inline SoraAlert for feedback inside dialogs.',
    ],
    styling: [
      '`.sora-toast-region`, `.sora-toast`, `.sora-toast__title`, `.sora-toast__description`',
      '`data-placement`, `data-color`',
    ],
  }),

  // ----------------------------------------------------------------- inputs
  component({
    name: 'SoraField',
    category: 'inputs',
    source: 'components/inputs/SoraField.vue',
    entry: 'core',
    summary: 'Label, hint and error wiring for any control; the layout primitive every input is built on.',
    attrs: 'The root element (`<div>` or `<fieldset>`).',
    keyboard: [],
    a11y: [
      'The label points at the control (`for`/`id`); hint and error ids are exposed for `aria-describedby`.',
      '`as="fieldset"` renders `<fieldset>`/`<legend>` for groups.',
      'Errors pair colour with an icon and text; the required marker is decorative because the control carries `required`.',
    ],
    styling: [FIELD_PARTS, '`data-size`, `data-orientation`, `data-invalid`, `data-disabled`'],
  }),
  component({
    name: 'SoraInput',
    category: 'inputs',
    source: 'components/inputs/SoraInput.vue',
    entry: 'core',
    summary: 'A single-line text field (text, email, url, tel, search).',
    attrs: CONTROL_ATTRS,
    keyboard: ['Native text editing.'],
    a11y: [
      'Native `<input>` with a real `<label>`; `aria-invalid` and `aria-describedby` are kept in sync.',
      'Caller-supplied `aria-describedby` ids are merged with the generated ones.',
      'On coarse pointers the text is at least 16px, so focusing does not zoom the page.',
    ],
    styling: [FIELD_PARTS, '`.sora-input`, `.sora-input__control`, `.sora-input__affix`'],
  }),
  component({
    name: 'SoraTextarea',
    category: 'inputs',
    source: 'components/inputs/SoraTextarea.vue',
    entry: 'core',
    summary: 'A multi-line text field with optional content-based autosizing.',
    attrs: CONTROL_ATTRS,
    keyboard: ['Native text editing.'],
    a11y: [
      'Native `<textarea>` with a real `<label>`.',
      '`autosize` uses `field-sizing: content` between `rows` and `maxRows`, then scrolls.',
    ],
    styling: [FIELD_PARTS, '`.sora-textarea`', '`data-autosize`'],
  }),
  component({
    name: 'SoraPasswordInput',
    category: 'inputs',
    source: 'components/inputs/SoraPasswordInput.vue',
    entry: 'core',
    summary: 'A password field with an optional reveal toggle.',
    attrs: CONTROL_ATTRS,
    keyboard: ['Native text editing.', 'The reveal toggle is a button (Enter/Space).'],
    a11y: [
      'The toggle is a button with a constant name and `aria-pressed`.',
      '`autocomplete` defaults to `current-password` and can be overridden (for example `new-password`).',
    ],
    styling: [FIELD_PARTS, '`.sora-input`, `.sora-input__button`'],
  }),
  component({
    name: 'SoraNumberInput',
    category: 'inputs',
    source: 'components/inputs/SoraNumberInput.vue',
    entry: 'core',
    summary: 'A numeric field whose value is a number or `null`, never a silently coerced zero.',
    attrs: CONTROL_ATTRS,
    keyboard: ['Arrow Up/Down step the value (native `type="number"`).'],
    a11y: [
      'Native `<input type="number">` with `inputmode="decimal"`.',
      'Empty or unparsable text yields `null`; unparsable text also marks the field invalid with a translated message.',
      'The optional stepper buttons are pointer conveniences (`tabindex="-1"`) with translated names.',
    ],
    styling: [FIELD_PARTS, '`.sora-input`, `.sora-input__steppers`, `.sora-input__button`'],
  }),
  component({
    name: 'SoraDateInput',
    category: 'inputs',
    source: 'components/inputs/SoraDateInput.vue',
    entry: 'core',
    summary: 'A native date field whose value is a date-only `YYYY-MM-DD` string.',
    attrs: CONTROL_ATTRS,
    keyboard: ['Native date editing and picker.'],
    a11y: [
      'Native `<input type="date">`: the platform picker and its accessibility.',
      'The value never becomes a `Date`, so there is no time-zone conversion.',
    ],
    styling: [FIELD_PARTS, '`.sora-input`, `.sora-input__control`'],
  }),
  component({
    name: 'SoraCheckbox',
    category: 'inputs',
    source: 'components/inputs/SoraCheckbox.vue',
    entry: 'core',
    summary: 'A single checkbox with an optional mixed state.',
    attrs: CONTROL_ATTRS,
    keyboard: ['Space toggles (native).'],
    a11y: [
      'Native `<input type="checkbox">` inside its `<label>`: the whole row is the click target.',
      '`v-model:indeterminate` sets the native `indeterminate` property (announced as "mixed").',
      'On coarse pointers the row is at least 44px high.',
    ],
    styling: [
      '`.sora-check`, `.sora-check__row`, `.sora-check__input`, `.sora-check__label`, `.sora-check__hint`',
      '`data-size`, `data-invalid`, `data-disabled`',
    ],
  }),
  component({
    name: 'SoraCheckboxGroup',
    category: 'inputs',
    source: 'components/inputs/SoraCheckboxGroup.vue',
    entry: 'core',
    summary: 'A labelled group of checkboxes bound to an array of typed values.',
    attrs: 'The `<fieldset>` root. `controlAttrs` is applied to every native checkbox.',
    keyboard: ['Tab moves between checkboxes; Space toggles (native).'],
    a11y: [
      '`<fieldset>` with a `<legend>`; hint and error describe the group.',
      'A disabled group disables the fieldset natively.',
    ],
    styling: [FIELD_PARTS, '`.sora-option-list`, `.sora-check`', '`data-orientation`'],
  }),
  component({
    name: 'SoraRadioGroup',
    category: 'inputs',
    source: 'components/inputs/SoraRadioGroup.vue',
    entry: 'core',
    summary: 'A labelled group of radios bound to one typed value.',
    attrs: 'The `<fieldset>` root. `controlAttrs` is applied to every native radio.',
    keyboard: [
      'Arrow keys move and select within the group; Tab enters and leaves it (native radio behaviour).',
    ],
    a11y: [
      '`<fieldset>` with a `<legend>` and native radios that share one `name`.',
      '`required` is set on the radios, which is how a required radio group is exposed natively.',
    ],
    styling: [FIELD_PARTS, '`.sora-option-list`, `.sora-check[data-kind="radio"]`', '`data-orientation`'],
  }),
  component({
    name: 'SoraSwitch',
    category: 'inputs',
    source: 'components/inputs/SoraSwitch.vue',
    entry: 'core',
    summary: 'An on/off setting that takes effect immediately.',
    attrs: CONTROL_ATTRS,
    keyboard: ['Space toggles (native).'],
    a11y: [
      'Native checkbox with `role="switch"`.',
      'Never mixed: a stray `indeterminate` is cleared.',
      'The thumb position, not only the colour, shows the state.',
    ],
    styling: [
      '`.sora-switch`, `.sora-switch__track`, `.sora-switch__thumb`, `.sora-switch__label`',
      '`data-size`, `data-label-placement`',
    ],
  }),
  component({
    name: 'SoraSelect',
    category: 'inputs',
    source: 'components/inputs/SoraSelect.vue',
    entry: 'core',
    summary: 'A native select with typed options and option groups.',
    attrs: CONTROL_ATTRS,
    keyboard: ['Native select behaviour (arrows, typeahead, platform picker).'],
    a11y: [
      'Native `<select>`/`<optgroup>`: platform semantics and pickers on every device.',
      'The empty option represents `null`; with `required` it cannot be chosen again.',
    ],
    styling: [FIELD_PARTS, '`.sora-input.sora-select`, `.sora-select__control`, `.sora-select__chevron`'],
  }),
  component({
    name: 'SoraCombobox',
    category: 'inputs',
    source: 'components/inputs/SoraCombobox.vue',
    entry: 'core',
    summary: 'A searchable single-select with local filtering or an asynchronous source.',
    attrs: CONTROL_ATTRS,
    keyboard: [
      'Arrow Down/Up open the popup and move the active option; Alt+Down opens without moving, Alt+Up closes.',
      'Enter selects the active option (and does not submit the form while the popup is open).',
      'Escape closes the popup; with the popup closed it clears the selection.',
      'Tab closes the popup and moves on. Typing filters and opens the popup.',
    ],
    a11y: [
      'APG combobox with list autocomplete: `role="combobox"`, `aria-expanded`, `aria-controls`, `aria-activedescendant`; options are `role="option"` in a `role="listbox"`.',
      'DOM focus stays in the input. The popup is a manual popover in the top layer, anchored to the field.',
      'Result counts, loading and errors are announced through a polite live region.',
      'Superseded asynchronous requests are aborted and stale results are discarded.',
    ],
    styling: [
      FIELD_PARTS,
      '`.sora-input.sora-combobox`, `.sora-combobox__popup`, `.sora-listbox`, `.sora-listbox__option`',
    ],
  }),
  component({
    name: 'SoraSlider',
    category: 'inputs',
    source: 'components/inputs/SoraSlider.vue',
    entry: 'core',
    summary: 'Chooses a number from a range with a native range input.',
    attrs: CONTROL_ATTRS,
    keyboard: [
      'Arrow keys change by `step`; Home/End jump to `min`/`max`; Page Up/Down by a larger step (native).',
    ],
    a11y: [
      'Native `<input type="range">` with `min`, `max` and `step`; mirrors in right-to-left text.',
      '`formatValue` also supplies `aria-valuetext`; the visible value is an `<output>` tied to the input.',
    ],
    styling: [FIELD_PARTS, '`.sora-slider`, `.sora-slider__input`, `.sora-slider__value`', '`data-color`'],
  }),
  component({
    name: 'SoraFileInput',
    category: 'inputs',
    source: 'components/inputs/SoraFileInput.vue',
    entry: 'core',
    summary: 'Chooses files with the native file input and exposes the actual `File` objects.',
    attrs: CONTROL_ATTRS,
    keyboard: ['Enter or Space opens the file dialog (native).', 'Each selected file has a remove button.'],
    a11y: [
      'The real `<input type="file">` covers the picker, so native semantics, keyboard and file drop are intact.',
      'Removing a file or a form reset updates both the model and the native input.',
      'Preview object URLs are revoked when their file leaves the selection and on unmount.',
    ],
    styling: [FIELD_PARTS, '`.sora-file`, `.sora-file__button`, `.sora-file__list`, `.sora-file__item`'],
  }),

  // ------------------------------------------------------------------ forms
  component({
    name: 'SoraForm',
    category: 'forms',
    source: 'forms/SoraForm.vue',
    entry: 'forms',
    summary: 'A `<form>` bound to a Formisch store that awaits a typed submit callback.',
    attrs: 'The native `<form>`.',
    keyboard: ['Enter in a field submits (native implicit submission).'],
    a11y: [
      '`novalidate`: validation and messages come from the schema, shown next to each field.',
      'After a failed submission focus moves to the first invalid field.',
      '`aria-busy` while submitting; further submissions (button, Enter, `requestSubmit()`) are ignored until it settles.',
    ],
    styling: ['`.sora-form`'],
  }),
  component({
    name: 'SoraFormErrorSummary',
    category: 'forms',
    source: 'forms/SoraFormErrorSummary.vue',
    entry: 'forms',
    summary: 'Lists every validation error of a form, deep fields included, with links that focus the field.',
    attrs: 'The root `<div>`.',
    keyboard: ['Each entry is a link; activating it focuses the field.'],
    a11y: [
      'Uses `getDeepErrorEntries`, so nested and array fields are included.',
      'A labelled group; it becomes `role="alert"` only for form-level errors, which no field would announce.',
      'Entry text is "<field label>: <message>", taken from the field\'s real label or legend.',
    ],
    styling: ['`.sora-alert.sora-error-summary`, `.sora-error-summary__list`'],
  }),

  // --------------------------------------------------------------- overlays
  component({
    name: 'SoraDialog',
    category: 'overlays',
    source: 'components/overlays/SoraDialog.vue',
    entry: 'core',
    summary: 'A modal dialog built on `<dialog>.showModal()`.',
    attrs: 'The native `<dialog>`.',
    keyboard: [
      'Tab and Shift+Tab stay inside the dialog (native modal containment).',
      'Escape closes it unless `closeOnEscape` is false.',
      'On close, focus returns to the element that opened it (or to `returnFocus`).',
    ],
    a11y: [
      'Native modal dialog: top layer, inert page, labelled by its title and described by its description.',
      '`role="alertdialog"` is available for confirmations.',
      '`v-model:open` stays in sync with native `cancel`/`close`, however the dialog was closed.',
      'Height is bounded with `dvh` and safe-area insets; the body scrolls.',
    ],
    styling: [
      '`.sora-dialog`, `.sora-dialog__panel`, `.sora-dialog__header`, `.sora-dialog__title`, `.sora-dialog__body`, `.sora-dialog__footer`',
      '`data-size`',
    ],
  }),
  component({
    name: 'SoraDrawer',
    category: 'overlays',
    source: 'components/overlays/SoraDrawer.vue',
    entry: 'core',
    summary:
      'A sheet that moves like a native one: snap points, a drag that follows the finger, flicks with momentum, rubber banding, from any edge.',
    attrs: 'The sheet layer: the native `<dialog>` (modal) or the popover `<div>` (non-modal).',
    keyboard: [
      'Modal: Tab stays inside (native modal containment); focus starts on the sheet and returns to the opener.',
      'Escape closes it when it is dismissible.',
      'The grabber is a button when there are snap points: Enter or Space steps through them, ArrowUp and ArrowDown pick a larger or a smaller one.',
    ],
    a11y: [
      'A modal sheet is a native modal dialog, labelled by its title and described by its description; a non-modal one is a non-modal dialog that leaves focus and the page alone.',
      'Every gesture has an equivalent: the grabber button for snap points, Escape, the backdrop and the close button for dismissal.',
      'Content scrolls only at the largest snap point, and a drag that starts in scrolled content goes to the content first.',
      'With reduced motion the sheet moves without animation.',
    ],
    styling: [
      '`.sora-drawer`, `.sora-drawer__backdrop`, `.sora-drawer__panel`, `.sora-drawer__handle`, `.sora-drawer__header`, `.sora-drawer__body`, `.sora-drawer__footer`',
      '`data-side`, `data-size`, `data-state`, `data-expanded`, `data-dragging`, `data-fit`, `data-modal`',
      '`--sora-duration-sheet`, `--sora-ease-sheet`; `data-sora-no-drag` keeps an element from starting a drag',
    ],
  }),
  component({
    name: 'SoraPopover',
    category: 'overlays',
    source: 'components/overlays/SoraPopover.vue',
    entry: 'core',
    summary: 'A non-modal panel anchored to its trigger, using the Popover API and CSS anchor positioning.',
    attrs: 'The built-in trigger button. With a custom trigger, bind `attrs`/`on`/`ref` yourself.',
    keyboard: [
      'Enter or Space on the trigger toggles the panel.',
      'Tab moves from the trigger into the panel (it follows the trigger in the DOM).',
      'Escape closes it and returns focus to the trigger.',
    ],
    a11y: [
      'The trigger has `aria-expanded` and `aria-controls`.',
      'With `title` or `label` the panel is a named non-modal `role="dialog"`; otherwise it is a plain disclosure.',
      'Light dismiss and focus return are native (`popover="auto"`).',
    ],
    styling: ['`.sora-popover`, `.sora-popover__title`', '`data-placement`'],
  }),
  component({
    name: 'SoraTooltip',
    category: 'overlays',
    source: 'components/overlays/SoraTooltip.vue',
    entry: 'core',
    summary: 'A short, supplementary description shown on hover and keyboard focus.',
    attrs: 'The wrapper `<span>` around the trigger.',
    keyboard: [
      'Shows on keyboard focus without delay.',
      'Escape dismisses it without closing a surrounding dialog.',
    ],
    a11y: [
      '`role="tooltip"`; bind the slot\'s `describedBy` to `aria-describedby` on the focusable control.',
      'Stays while the trigger is hovered or focused, or the tooltip itself is hovered (WCAG 1.4.13).',
      'Text only: never put interactive content in a tooltip.',
    ],
    styling: ['`.sora-tooltip-anchor`, `.sora-tooltip`', '`data-placement`'],
  }),
  component({
    name: 'SoraDropdownMenu',
    category: 'overlays',
    source: 'components/overlays/SoraDropdownMenu.vue',
    entry: 'core',
    summary: 'A menu of actions (or links) opened from a button.',
    attrs: 'The built-in trigger button. With a custom trigger, bind `attrs`/`on`/`ref` yourself.',
    keyboard: [
      'Enter, Space or Arrow Down on the trigger opens the menu on the first item; Arrow Up on the last.',
      'Arrow Up/Down move (wrapping); Home/End jump; typing characters jumps to a matching item.',
      'Enter or Space activates the item and closes the menu.',
      'Escape closes and returns focus to the trigger; Tab closes and moves on.',
    ],
    a11y: [
      'APG menu button: the trigger has `aria-haspopup="menu"` and `aria-expanded`; items are `role="menuitem"` in `role="menu"`.',
      'Disabled items stay focusable (`aria-disabled`) but cannot be activated.',
      'For actions and in-app commands only: ordinary site navigation should be links, not a menu.',
    ],
    styling: [
      '`.sora-popover.sora-menu`, `.sora-menu__item`, `.sora-menu__label`, `.sora-menu__separator`',
      '`data-placement`, item `data-color`',
    ],
  }),

  // ------------------------------------------------------------- navigation
  component({
    name: 'SoraTabs',
    category: 'navigation',
    source: 'components/navigation/SoraTabs.vue',
    entry: 'core',
    summary: 'Switches between panels from a typed array of tabs.',
    attrs: 'The root `<div>`.',
    keyboard: [
      'Arrow keys move between tabs along the orientation (mirrored in right-to-left text); Home/End jump.',
      '`activation="automatic"` selects on focus; `"manual"` selects on Enter or Space.',
      'Tab moves from the selected tab into the panel.',
    ],
    a11y: [
      'APG tabs: `role="tablist"`/`tab`/`tabpanel`, `aria-selected`, `aria-controls`, `aria-labelledby`, roving `tabindex`.',
      'Disabled tabs are skipped.',
      'The selected tab is marked by a bar or fill, not by colour alone.',
    ],
    styling: [
      '`.sora-tabs`, `.sora-tabs__list`, `.sora-tabs__tab`, `.sora-tabs__panel`',
      '`data-orientation`, `data-variant`, `data-size`',
    ],
  }),
  component({
    name: 'SoraAccordion',
    category: 'navigation',
    source: 'components/navigation/SoraAccordion.vue',
    entry: 'core',
    summary: 'Expandable sections from a typed array.',
    attrs: 'The root `<div>`.',
    keyboard: [
      'Enter or Space toggles a section (native button).',
      'Arrow Up/Down and Home/End move between headers.',
    ],
    a11y: [
      'APG accordion: each header is a heading that contains a button with `aria-expanded` and `aria-controls`.',
      'Closed panels are `inert`: out of the tab order and the accessibility tree.',
      'Panels are regions when there are six or fewer.',
    ],
    styling: [
      '`.sora-accordion`, `.sora-accordion__item`, `.sora-accordion__trigger`, `.sora-accordion__panel`, `.sora-accordion__content`',
      '`data-size`, `data-open`',
    ],
  }),
  component({
    name: 'SoraBreadcrumbs',
    category: 'navigation',
    source: 'components/navigation/SoraBreadcrumbs.vue',
    entry: 'core',
    summary: 'Shows the path to the current page as links.',
    attrs: 'The `<nav>` element.',
    keyboard: ['Links are ordinary tab stops.'],
    a11y: [
      'A labelled `<nav>` with an ordered list of links: navigation, not a menu.',
      'The last item is `aria-current="page"` and is not a link.',
      'Separators are decorative and mirror in right-to-left text.',
    ],
    styling: ['`.sora-breadcrumbs`, `.sora-breadcrumbs__link`, `.sora-breadcrumbs__separator`'],
  }),
  component({
    name: 'SoraPagination',
    category: 'navigation',
    source: 'components/navigation/SoraPagination.vue',
    entry: 'core',
    summary: 'Moves between pages of a result set.',
    attrs: 'The `<nav>` element.',
    keyboard: ['Every page control is a button in the tab order (Enter/Space).'],
    a11y: [
      'A labelled `<nav>`; the current page has `aria-current="page"` and a translated name.',
      'Previous/next have translated names and mirror in right-to-left text.',
      'Narrow containers collapse the page buttons to "Page x of y".',
    ],
    styling: ['`.sora-pagination`, `.sora-pagination__button`, `.sora-pagination__status`', '`data-size`'],
  }),

  // ------------------------------------------------------------------- data
  component({
    name: 'SoraTable',
    category: 'data',
    source: 'components/data/SoraTable.vue',
    entry: 'core',
    summary: 'A data table from typed columns and rows, with optional controlled sorting and selection.',
    attrs: 'The scroll wrapper `<div>`.',
    keyboard: [
      'Sortable headers are buttons (Enter/Space) that cycle ascending, descending, none.',
      'Selection uses checkboxes (Space).',
      'When the table overflows, the wrapper becomes a focusable region that scrolls with the arrow keys.',
    ],
    a11y: [
      'Real table markup (`<table>`, `<caption>`, `<th scope>`); no grid role, because it is not an interactive grid.',
      '`aria-sort` on sortable headers; `aria-busy` and a status message while loading.',
      'Row checkboxes are named after the row header cell.',
    ],
    styling: [
      '`.sora-table-wrap`, `.sora-table`, `.sora-table__cell`, `.sora-table__row`, `.sora-table__sort`',
      '`data-size`, `data-striped`',
    ],
  }),
])

export const componentCategories: readonly SoraComponentCategory[] = Object.freeze([
  'foundation',
  'actions',
  'display',
  'feedback',
  'inputs',
  'forms',
  'overlays',
  'navigation',
  'data',
])

export const componentNames: readonly string[] = Object.freeze(componentManifest.map((entry) => entry.name))
