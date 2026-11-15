import type { UiColor, UiSize, UiVariant } from '@your-scope/theme'

export type {
  UiColor,
  UiColorRole,
  UiComponentDefaults,
  UiComponentDefaultsInput,
  UiDensity,
  UiMotion,
  UiPadding,
  UiRadius,
  UiSize,
  UiSurfaceVariant,
  UiVariant,
} from '@your-scope/theme'

/** A selectable value with a human-readable label. */
export interface UiOption<T extends string | number = string> {
  value: T
  label: string
  disabled?: boolean | undefined
  /** Secondary line shown under the label where the component supports it. */
  description?: string | undefined
}

/** A labelled group of options (native `<optgroup>` in UiSelect). */
export interface UiOptionGroup<T extends string | number = string> {
  label: string
  options: readonly UiOption<T>[]
  disabled?: boolean | undefined
}

export type UiDirection = 'ltr' | 'rtl'
export type UiOrientation = 'horizontal' | 'vertical'
export type UiColorModeSetting = 'light' | 'dark' | 'system'

/** Logical placement of an anchored overlay relative to its trigger. */
export type UiPlacement =
  | 'bottom-start'
  | 'bottom'
  | 'bottom-end'
  | 'top-start'
  | 'top'
  | 'top-end'
  | 'start'
  | 'end'

/** The well-known part of a native-control binding. */
export interface UiControlBinding {
  readonly name?: string | undefined
  readonly autofocus?: boolean | undefined
  /** Receives the native element on mount and `null` on unmount. */
  readonly ref?: ((element: Element | null) => void) | undefined
  readonly onFocus?: ((event: FocusEvent) => void) | undefined
  readonly onBlur?: ((event: FocusEvent) => void) | undefined
  readonly onChange?: ((event: Event) => void) | undefined
  readonly onInput?: ((event: Event) => void) | undefined
}

/**
 * Attributes, listeners and a `ref` callback bound to the *native* control
 * of a wrapper component.
 *
 * This is a structural type on purpose: it accepts Formisch's `field.props`
 * (and any similar binding object) without the core package importing a
 * forms library, even at the type level. The union lets both an interface
 * typed binding and an object literal with extra attributes type-check.
 */
export type UiControlAttrs = UiControlBinding | (UiControlBinding & Readonly<Record<string, unknown>>)

/** Trusted, static SVG path data rendered by UiIcon. */
export interface UiIconDefinition {
  /** One or more `d` attribute values, drawn on a 24x24 grid. */
  readonly paths: readonly string[]
  /** Filled glyph instead of the default 1.75px stroke. */
  readonly filled?: boolean | undefined
  /** Mirror horizontally in right-to-left contexts (directional glyphs only). */
  readonly directional?: boolean | undefined
}

/** Shared appearance vocabulary. */
export interface UiAppearanceProps {
  size?: UiSize | undefined
  color?: UiColor | undefined
  variant?: UiVariant | undefined
}
