/** The seven semantic colour intents every component understands. */
export type SoraColorRole = 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral'

export const SORA_COLOR_ROLES = [
  'primary',
  'secondary',
  'success',
  'info',
  'warning',
  'error',
  'neutral',
] as const satisfies readonly SoraColorRole[]

/** Tonal steps of a palette, light (50) to dark (950). */
export type SoraShade = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950

export const SORA_SHADES = [
  50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950,
] as const satisfies readonly SoraShade[]

/** An OKLCH colour: lightness 0..1, chroma, hue in degrees. */
export type Oklch = readonly [lightness: number, chroma: number, hue: number]

/** A complete tonal scale. */
export type SoraPaletteScale = Readonly<Record<SoraShade, Oklch>>

export type SoraBuiltinPalette =
  | 'neutral'
  | 'taupe'
  | 'terracotta'
  | 'green'
  | 'blue'
  | 'amber'
  | 'red'
  | 'violet'
  | 'teal'

export type SoraDensity = 'compact' | 'comfortable'
export type SoraRadius = 'none' | 'sm' | 'md' | 'lg'
export type SoraMotion = 'none' | 'subtle' | 'standard'
/**
 * `inherit` (default) follows the host page's own `color-scheme`, so importing
 * the stylesheet never turns a light-only page dark.
 */
export type SoraColorMode = 'inherit' | 'light' | 'dark' | 'system'

// Shared component vocabulary (re-exported by @your-scope/ui).
export type SoraSize = 'sm' | 'md' | 'lg'
export type SoraColor = SoraColorRole
export type SoraVariant = 'solid' | 'soft' | 'outline' | 'ghost' | 'link'
export type SoraSurfaceVariant = 'outline' | 'soft' | 'elevated' | 'plain'
export type SoraPadding = 'none' | 'sm' | 'md' | 'lg'

/** Per-component prop defaults that `sora.config.ts` and `SoraProvider` can change. */
export interface SoraComponentDefaults {
  button: { size: SoraSize; variant: SoraVariant; color: SoraColor }
  iconButton: { size: SoraSize; variant: SoraVariant; color: SoraColor }
  link: { color: SoraColor }
  card: { padding: SoraPadding; variant: SoraSurfaceVariant }
  badge: { size: SoraSize; variant: Exclude<SoraVariant, 'link' | 'ghost'>; color: SoraColor }
  alert: { variant: Exclude<SoraVariant, 'link' | 'ghost'>; color: SoraColor }
  avatar: { size: SoraSize }
  /** Shared by every form control (input, select, checkbox, ...). */
  control: { size: SoraSize }
  tabs: { size: SoraSize }
  table: { size: SoraSize }
}

export type SoraComponentDefaultsInput = {
  readonly [K in keyof SoraComponentDefaults]?: Partial<SoraComponentDefaults[K]>
}

export interface SoraFontConfig {
  sans: string
  serif: string
  mono: string
  /** Family used for display headings (`--sora-font-display`). */
  display: 'sans' | 'serif'
}

/** Raw CSS values keyed by custom property name, applied after resolution. */
export type SoraTokenOverrides = Readonly<Record<`--sora-${string}`, string>>

export interface SoraConfigInput<TPalette extends string = never> {
  /**
   * Each value names a palette (never another semantic role). `NoInfer`
   * keeps a typo from being inferred as a new palette name: only the keys of
   * `palettes` extend the set of valid values.
   */
  readonly colors?: Partial<Record<SoraColorRole, SoraBuiltinPalette | NoInfer<TPalette>>>
  /** Extra palettes that `colors` may reference by name. */
  readonly palettes?: Readonly<Record<TPalette, SoraPaletteScale>>
  readonly colorMode?: SoraColorMode
  readonly density?: SoraDensity
  readonly radius?: SoraRadius
  readonly motion?: SoraMotion
  readonly fonts?: Partial<SoraFontConfig>
  readonly defaults?: SoraComponentDefaultsInput
  /** Escape hatch: final token values per scheme (`both` applies to light and dark). */
  readonly tokens?: {
    readonly both?: SoraTokenOverrides
    readonly light?: SoraTokenOverrides
    readonly dark?: SoraTokenOverrides
  }
}

/** Fully resolved configuration (every option present). */
export interface SoraConfig {
  readonly colors: Readonly<Record<SoraColorRole, string>>
  readonly palettes: Readonly<Record<string, SoraPaletteScale>>
  readonly colorMode: SoraColorMode
  readonly density: SoraDensity
  readonly radius: SoraRadius
  readonly motion: SoraMotion
  readonly fonts: SoraFontConfig
  readonly defaults: SoraComponentDefaults
  readonly tokens: {
    readonly both: SoraTokenOverrides
    readonly light: SoraTokenOverrides
    readonly dark: SoraTokenOverrides
  }
}

export type SoraScheme = 'light' | 'dark'

/** A colour with optional alpha, kept numeric so contrast can be measured. */
export interface SoraColorValue {
  readonly oklch: Oklch
  readonly alpha: number
}
