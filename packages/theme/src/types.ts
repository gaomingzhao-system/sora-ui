/** The seven semantic colour intents every component understands. */
export type UiColorRole = 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral'

export const UI_COLOR_ROLES = [
  'primary',
  'secondary',
  'success',
  'info',
  'warning',
  'error',
  'neutral',
] as const satisfies readonly UiColorRole[]

/** Tonal steps of a palette, light (50) to dark (950). */
export type UiShade = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950

export const UI_SHADES = [
  50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950,
] as const satisfies readonly UiShade[]

/** An OKLCH colour: lightness 0..1, chroma, hue in degrees. */
export type Oklch = readonly [lightness: number, chroma: number, hue: number]

/** A complete tonal scale. */
export type UiPaletteScale = Readonly<Record<UiShade, Oklch>>

export type UiBuiltinPalette =
  | 'neutral'
  | 'taupe'
  | 'terracotta'
  | 'green'
  | 'blue'
  | 'amber'
  | 'red'
  | 'violet'
  | 'teal'

export type UiDensity = 'compact' | 'comfortable'
export type UiRadius = 'none' | 'sm' | 'md' | 'lg'
export type UiMotion = 'none' | 'subtle' | 'standard'
/**
 * `inherit` (default) follows the host page's own `color-scheme`, so importing
 * the stylesheet never turns a light-only page dark.
 */
export type UiColorMode = 'inherit' | 'light' | 'dark' | 'system'

// Shared component vocabulary (re-exported by @your-scope/ui).
export type UiSize = 'sm' | 'md' | 'lg'
export type UiColor = UiColorRole
export type UiVariant = 'solid' | 'soft' | 'outline' | 'ghost' | 'link'
export type UiSurfaceVariant = 'outline' | 'soft' | 'elevated' | 'plain'
export type UiPadding = 'none' | 'sm' | 'md' | 'lg'

/** Per-component prop defaults that `ui.config.ts` and `UiProvider` can change. */
export interface UiComponentDefaults {
  button: { size: UiSize; variant: UiVariant; color: UiColor }
  iconButton: { size: UiSize; variant: UiVariant; color: UiColor }
  link: { color: UiColor }
  card: { padding: UiPadding; variant: UiSurfaceVariant }
  badge: { size: UiSize; variant: Exclude<UiVariant, 'link' | 'ghost'>; color: UiColor }
  alert: { variant: Exclude<UiVariant, 'link' | 'ghost'>; color: UiColor }
  avatar: { size: UiSize }
  /** Shared by every form control (input, select, checkbox, ...). */
  control: { size: UiSize }
  tabs: { size: UiSize }
  table: { size: UiSize }
}

export type UiComponentDefaultsInput = {
  readonly [K in keyof UiComponentDefaults]?: Partial<UiComponentDefaults[K]>
}

export interface UiFontConfig {
  sans: string
  serif: string
  mono: string
  /** Family used for display headings (`--vui-font-display`). */
  display: 'sans' | 'serif'
}

/** Raw CSS values keyed by custom property name, applied after resolution. */
export type UiTokenOverrides = Readonly<Record<`--vui-${string}`, string>>

export interface UiConfigInput<TPalette extends string = never> {
  /** Each value names a palette (never another semantic role). */
  readonly colors?: Partial<Record<UiColorRole, UiBuiltinPalette | TPalette>>
  /** Extra palettes that `colors` may reference by name. */
  readonly palettes?: Readonly<Record<TPalette, UiPaletteScale>>
  readonly colorMode?: UiColorMode
  readonly density?: UiDensity
  readonly radius?: UiRadius
  readonly motion?: UiMotion
  readonly fonts?: Partial<UiFontConfig>
  readonly defaults?: UiComponentDefaultsInput
  /** Escape hatch: final token values per scheme (`both` applies to light and dark). */
  readonly tokens?: {
    readonly both?: UiTokenOverrides
    readonly light?: UiTokenOverrides
    readonly dark?: UiTokenOverrides
  }
}

/** Fully resolved configuration (every option present). */
export interface UiConfig {
  readonly colors: Readonly<Record<UiColorRole, string>>
  readonly palettes: Readonly<Record<string, UiPaletteScale>>
  readonly colorMode: UiColorMode
  readonly density: UiDensity
  readonly radius: UiRadius
  readonly motion: UiMotion
  readonly fonts: UiFontConfig
  readonly defaults: UiComponentDefaults
  readonly tokens: {
    readonly both: UiTokenOverrides
    readonly light: UiTokenOverrides
    readonly dark: UiTokenOverrides
  }
}

export type UiScheme = 'light' | 'dark'

/** A colour with optional alpha, kept numeric so contrast can be measured. */
export interface UiColorValue {
  readonly oklch: Oklch
  readonly alpha: number
}
