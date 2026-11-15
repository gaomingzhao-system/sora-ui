import { contrastRatio, flatten, formatOklch, oklchToSrgb } from './color.ts'
import type { Rgb } from './color.ts'
import { normalizeUiConfig } from './define-ui-config.ts'
import { isNeutralScale } from './palettes.ts'
import { UI_COLOR_ROLES } from './types.ts'
import type {
  Oklch,
  UiColorRole,
  UiColorValue,
  UiConfig,
  UiConfigInput,
  UiDensity,
  UiMotion,
  UiPaletteScale,
  UiRadius,
  UiScheme,
  UiShade,
} from './types.ts'

export type UiTokenName = `--vui-${string}`
export type UiDeclarations = Readonly<Record<UiTokenName, string>>

/** A colour token: numeric values per scheme plus the CSS that expresses it. */
export interface UiColorToken {
  readonly name: UiTokenName
  readonly light: UiColorValue
  readonly dark: UiColorValue
  /**
   * CSS expression used instead of a literal `light-dark()` pair, for tokens
   * derived from another token (soft fills are `color-mix()` over the role).
   */
  readonly expression?: string
}

export interface UiResolvedTheme {
  readonly config: UiConfig
  readonly colors: readonly UiColorToken[]
  /** Scheme-independent tokens that do not depend on density/radius/motion. */
  readonly base: UiDeclarations
  readonly density: Readonly<Record<UiDensity, UiDeclarations>>
  readonly radius: Readonly<Record<UiRadius, UiDeclarations>>
  readonly motion: Readonly<Record<UiMotion, UiDeclarations>>
  /** Non-fatal problems, e.g. a palette that cannot reach a contrast target. */
  readonly warnings: readonly string[]
}

const WHITE: Oklch = [1, 0, 0]
const AA_TEXT = 4.5
const AA_UI = 3

const SOFT_ALPHA: Readonly<Record<UiScheme, number>> = { light: 0.12, dark: 0.16 }
const SOFT_HOVER_ALPHA: Readonly<Record<UiScheme, number>> = { light: 0.2, dark: 0.26 }

function opaque(oklch: Oklch): UiColorValue {
  return { oklch, alpha: 1 }
}

function translucent(oklch: Oklch, alpha: number): UiColorValue {
  return { oklch, alpha }
}

interface SchemeSurfaces {
  canvas: Oklch
  surface: Oklch
  elevated: Oklch
  subtle: Oklch
}

function surfacesOf(neutral: UiPaletteScale, scheme: UiScheme): SchemeSurfaces {
  return scheme === 'light'
    ? { canvas: neutral[50], surface: WHITE, elevated: WHITE, subtle: neutral[100] }
    : { canvas: neutral[950], surface: neutral[900], elevated: neutral[800], subtle: neutral[800] }
}

function backgroundsOf(surfaces: SchemeSurfaces): Rgb[] {
  return [surfaces.canvas, surfaces.surface, surfaces.elevated, surfaces.subtle].map(oklchToSrgb)
}

function minContrast(color: Oklch, backgrounds: readonly Rgb[]): number {
  const rgb = oklchToSrgb(color)
  return Math.min(...backgrounds.map((background) => contrastRatio(rgb, background)))
}

/**
 * First shade (in preference order) whose worst-case contrast reaches the
 * target; otherwise the best available shade plus a warning.
 */
function pickShade(
  scale: UiPaletteScale,
  candidates: readonly UiShade[],
  score: (color: Oklch) => number,
  target: number,
  describe: string,
  warnings: string[],
): Oklch {
  let best: Oklch = scale[candidates[0] ?? 500]
  let bestScore = -Infinity
  for (const shade of candidates) {
    const value = score(scale[shade])
    if (value >= target) return scale[shade]
    if (value > bestScore) {
      best = scale[shade]
      bestScore = value
    }
  }
  warnings.push(`${describe}: best contrast ${bestScore.toFixed(2)} is below ${target}`)
  return best
}

interface RoleScheme {
  solid: Oklch
  hover: Oklch
  active: Oklch
  on: Oklch
  text: Oklch
  border: Oklch
}

function resolveRole(
  role: UiColorRole,
  scale: UiPaletteScale,
  scheme: UiScheme,
  surfaces: SchemeSurfaces,
  warnings: string[],
): RoleScheme {
  const neutral = isNeutralScale(scale)
  const backgrounds = backgroundsOf(surfaces)
  const label = (part: string) => `${role}.${part} (${scheme})`

  // A filled control needs both a readable label (4.5:1) and a visible fill (3:1).
  const onCandidates: readonly Oklch[] = scheme === 'light' ? [WHITE, scale[950]] : [scale[950], WHITE]
  const bestOn = (fill: Oklch): { on: Oklch; ratio: number } => {
    const fillRgb = oklchToSrgb(fill)
    let result = { on: onCandidates[0] ?? WHITE, ratio: 0 }
    for (const candidate of onCandidates) {
      const ratio = contrastRatio(oklchToSrgb(candidate), fillRgb)
      if (ratio > result.ratio) result = { on: candidate, ratio }
    }
    return result
  }

  // Preference order per scheme; states step away from the label colour unless
  // the fill is already at the end of the scale.
  const ladders: Readonly<Record<UiScheme, readonly (readonly [UiShade, UiShade, UiShade])[]>> = neutral
    ? {
        light: [
          [900, 800, 700],
          [950, 800, 700],
          [800, 700, 600],
        ],
        dark: [
          [100, 200, 300],
          [50, 200, 300],
          [200, 300, 400],
        ],
      }
    : {
        light: [
          [600, 700, 800],
          [700, 800, 900],
          [800, 900, 950],
        ],
        dark: [
          [400, 300, 200],
          [300, 200, 100],
          [500, 400, 300],
        ],
      }

  let chosen: RoleScheme | undefined
  let fallback: { value: RoleScheme; score: number } | undefined
  for (const [solidShade, hoverShade, activeShade] of ladders[scheme]) {
    const solid = scale[solidShade]
    const { on } = bestOn(solid)
    const onRgb = oklchToSrgb(on)
    const labelContrast = Math.min(
      ...[solid, scale[hoverShade], scale[activeShade]].map((fill) =>
        contrastRatio(onRgb, oklchToSrgb(fill)),
      ),
    )
    const fillContrast = minContrast(solid, backgrounds)
    const candidate: RoleScheme = {
      solid,
      hover: scale[hoverShade],
      active: scale[activeShade],
      on,
      text: solid,
      border: solid,
    }
    if (labelContrast >= AA_TEXT && fillContrast >= AA_UI) {
      chosen = candidate
      break
    }
    const score = Math.min(labelContrast / AA_TEXT, fillContrast / AA_UI)
    if (!fallback || score > fallback.score) fallback = { value: candidate, score }
  }
  if (!chosen) {
    warnings.push(`${label('solid')}: no shade satisfies label 4.5:1 and fill 3:1`)
    chosen = fallback?.value ?? {
      solid: scale[600],
      hover: scale[700],
      active: scale[800],
      on: WHITE,
      text: scale[700],
      border: scale[500],
    }
  }

  // Role-coloured text must stay readable on every surface and on its own
  // soft fill (resting and hovered) composited over those surfaces.
  const softFills = (alpha: number): Rgb[] =>
    backgrounds.map((background) => flatten(translucent(chosen.solid, alpha), background))
  const textBackgrounds = [
    ...backgrounds,
    ...softFills(SOFT_ALPHA[scheme]),
    ...softFills(SOFT_HOVER_ALPHA[scheme]),
  ]
  const textCandidates: readonly UiShade[] =
    scheme === 'light'
      ? neutral
        ? [900, 950]
        : [700, 800, 900, 950]
      : neutral
        ? [100, 50]
        : [300, 200, 100, 50]
  const text = pickShade(
    scale,
    textCandidates,
    (color) => minContrast(color, textBackgrounds),
    AA_TEXT,
    label('text'),
    warnings,
  )

  const borderCandidates: readonly UiShade[] = scheme === 'light' ? [500, 600, 700] : [500, 400, 300]
  const border = pickShade(
    scale,
    borderCandidates,
    (color) => minContrast(color, backgrounds),
    AA_UI,
    label('border'),
    warnings,
  )

  return { ...chosen, text, border }
}

/** Soft fills follow the role token, so overriding `--vui-<role>` alone stays coherent. */
function softExpression(role: UiColorRole, alpha: Readonly<Record<UiScheme, number>>): string {
  const mix = (scheme: UiScheme): string =>
    `color-mix(in oklab, var(--vui-${role}) ${Math.round(alpha[scheme] * 100)}%, transparent)`
  return `light-dark(${mix('light')}, ${mix('dark')})`
}

function token(
  name: UiTokenName,
  light: UiColorValue,
  dark: UiColorValue,
  expression?: string,
): UiColorToken {
  return expression === undefined ? { name, light, dark } : { name, light, dark, expression }
}

const DENSITY: Readonly<Record<UiDensity, UiDeclarations>> = {
  compact: {
    '--vui-control-sm': '1.75rem',
    '--vui-control-md': '2.25rem',
    '--vui-control-lg': '2.5rem',
    '--vui-space-unit': '0.25rem',
    '--vui-gap-xs': '0.25rem',
    '--vui-gap-sm': '0.5rem',
    '--vui-gap-md': '0.75rem',
    '--vui-gap-lg': '1rem',
    '--vui-pad-sm': '0.5rem',
    '--vui-pad-md': '0.75rem',
    '--vui-pad-lg': '1rem',
    '--vui-pad-overlay': '1rem',
    '--vui-row': '2.25rem',
  },
  comfortable: {
    '--vui-control-sm': '2rem',
    '--vui-control-md': '2.5rem',
    '--vui-control-lg': '2.75rem',
    '--vui-space-unit': '0.25rem',
    '--vui-gap-xs': '0.375rem',
    '--vui-gap-sm': '0.625rem',
    '--vui-gap-md': '1rem',
    '--vui-gap-lg': '1.25rem',
    '--vui-pad-sm': '0.75rem',
    '--vui-pad-md': '1rem',
    '--vui-pad-lg': '1.25rem',
    '--vui-pad-overlay': '1.25rem',
    '--vui-row': '2.75rem',
  },
}

const RADIUS: Readonly<Record<UiRadius, UiDeclarations>> = {
  none: { '--vui-radius-sm': '0px', '--vui-radius-md': '0px', '--vui-radius-lg': '0px' },
  sm: { '--vui-radius-sm': '0.25rem', '--vui-radius-md': '0.375rem', '--vui-radius-lg': '0.5rem' },
  md: { '--vui-radius-sm': '0.375rem', '--vui-radius-md': '0.5rem', '--vui-radius-lg': '0.75rem' },
  lg: { '--vui-radius-sm': '0.5rem', '--vui-radius-md': '0.75rem', '--vui-radius-lg': '1rem' },
}

const MOTION: Readonly<Record<UiMotion, UiDeclarations>> = {
  none: { '--vui-duration-fast': '0ms', '--vui-duration-overlay': '0ms' },
  subtle: { '--vui-duration-fast': '120ms', '--vui-duration-overlay': '160ms' },
  standard: { '--vui-duration-fast': '140ms', '--vui-duration-overlay': '180ms' },
}

/** Turn a (partial) configuration into measurable, serialisable tokens. */
export function resolveTheme(input: UiConfigInput<string> = {}): UiResolvedTheme {
  const config = normalizeUiConfig(input)
  const warnings: string[] = []
  const scaleOf = (role: UiColorRole): UiPaletteScale => {
    const scale = config.palettes[config.colors[role]]
    if (!scale) throw new Error(`[@your-scope/theme] unknown palette "${config.colors[role]}"`)
    return scale
  }

  const neutral = scaleOf('neutral')
  const info = scaleOf('info')
  const light = surfacesOf(neutral, 'light')
  const dark = surfacesOf(neutral, 'dark')
  const lightBackgrounds = backgroundsOf(light)
  const darkBackgrounds = backgroundsOf(dark)

  const colors: UiColorToken[] = []
  const add = (name: UiTokenName, lightValue: Oklch, darkValue: Oklch): void => {
    colors.push(token(name, opaque(lightValue), opaque(darkValue)))
  }
  const pair = (
    name: string,
    lightCandidates: readonly UiShade[],
    darkCandidates: readonly UiShade[],
    target: number,
    scale: UiPaletteScale = neutral,
  ): void => {
    add(
      `--vui-${name}`,
      pickShade(
        scale,
        lightCandidates,
        (c) => minContrast(c, lightBackgrounds),
        target,
        `${name} (light)`,
        warnings,
      ),
      pickShade(
        scale,
        darkCandidates,
        (c) => minContrast(c, darkBackgrounds),
        target,
        `${name} (dark)`,
        warnings,
      ),
    )
  }

  // Surfaces
  add('--vui-canvas', light.canvas, dark.canvas)
  add('--vui-surface', light.surface, dark.surface)
  add('--vui-elevated', light.elevated, dark.elevated)
  add('--vui-subtle', light.subtle, dark.subtle)
  add('--vui-inverted', neutral[900], neutral[100])

  // Text
  pair('text', [950, 900], [50, 100], 7)
  pair('text-muted', [700, 800], [300, 200], AA_TEXT)
  pair('text-subtle', [600, 700], [400, 300], AA_TEXT)
  add('--vui-text-inverted', neutral[50], neutral[950])

  // Boundaries
  add('--vui-border', neutral[200], neutral[700])
  pair('border-strong', [500, 600], [500, 400], AA_UI)
  pair('focus', [600, 700], [400, 300], AA_UI, info)

  // Intents
  for (const role of UI_COLOR_ROLES) {
    const scale = scaleOf(role)
    const l = resolveRole(role, scale, 'light', light, warnings)
    const d = resolveRole(role, scale, 'dark', dark, warnings)
    add(`--vui-${role}`, l.solid, d.solid)
    add(`--vui-${role}-hover`, l.hover, d.hover)
    add(`--vui-${role}-active`, l.active, d.active)
    add(`--vui-on-${role}`, l.on, d.on)
    add(`--vui-${role}-text`, l.text, d.text)
    add(`--vui-${role}-border`, l.border, d.border)
    colors.push(
      token(
        `--vui-${role}-soft`,
        translucent(l.solid, SOFT_ALPHA.light),
        translucent(d.solid, SOFT_ALPHA.dark),
        softExpression(role, SOFT_ALPHA),
      ),
      token(
        `--vui-${role}-soft-hover`,
        translucent(l.solid, SOFT_HOVER_ALPHA.light),
        translucent(d.solid, SOFT_HOVER_ALPHA.dark),
        softExpression(role, SOFT_HOVER_ALPHA),
      ),
    )
  }

  // Overlays and elevation
  colors.push(
    token('--vui-scrim', translucent(neutral[950], 0.42), translucent([0.12, 0.004, neutral[950][2]], 0.62)),
    token('--vui-shadow-color', translucent(neutral[950], 0.14), translucent([0, 0, 0], 0.5)),
  )

  const fonts = config.fonts
  const base: UiDeclarations = {
    '--vui-font-sans': fonts.sans,
    '--vui-font-serif': fonts.serif,
    '--vui-font-mono': fonts.mono,
    '--vui-font-display': fonts.display === 'serif' ? 'var(--vui-font-serif)' : 'var(--vui-font-sans)',
    '--vui-text-xs': '0.75rem',
    '--vui-text-sm': '0.8125rem',
    '--vui-text-md': '0.875rem',
    '--vui-text-lg': '1rem',
    '--vui-text-xl': '1.125rem',
    '--vui-text-2xl': '1.375rem',
    '--vui-leading-tight': '1.25',
    '--vui-leading-normal': '1.5',
    '--vui-weight-normal': '400',
    '--vui-weight-medium': '500',
    '--vui-weight-semibold': '600',
    '--vui-radius-full': '9999px',
    '--vui-border-width': '1px',
    '--vui-focus-width': '2px',
    '--vui-focus-offset': '2px',
    '--vui-ease-out': 'cubic-bezier(0.2, 0, 0, 1)',
    '--vui-ease-in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
    '--vui-hover': 'color-mix(in oklab, var(--vui-text) 7%, transparent)',
    '--vui-pressed': 'color-mix(in oklab, var(--vui-text) 12%, transparent)',
    '--vui-shadow-sm': '0 1px 2px var(--vui-shadow-color)',
    '--vui-shadow-md': '0 1px 3px var(--vui-shadow-color), 0 6px 16px -4px var(--vui-shadow-color)',
    '--vui-shadow-lg': '0 2px 6px var(--vui-shadow-color), 0 16px 40px -12px var(--vui-shadow-color)',
    '--vui-disabled-opacity': '0.55',
    /** Minimum hit area; raised to 44px for coarse pointers in the generated CSS. */
    '--vui-hit-min': '0px',
  }

  return Object.freeze({
    config,
    colors: Object.freeze(colors),
    base: Object.freeze(base),
    density: DENSITY,
    radius: RADIUS,
    motion: MOTION,
    warnings: Object.freeze(warnings),
  })
}

function colorCss(color: UiColorToken): string {
  if (color.expression !== undefined) return color.expression
  const lightCss = formatOklch(color.light.oklch, color.light.alpha)
  const darkCss = formatOklch(color.dark.oklch, color.dark.alpha)
  return lightCss === darkCss ? lightCss : `light-dark(${lightCss}, ${darkCss})`
}

/** Every declaration of the resolved theme for the configured density/radius/motion. */
export function themeToVars(theme: UiResolvedTheme): UiDeclarations {
  const { config } = theme
  const declarations: Record<UiTokenName, string> = {}
  for (const color of theme.colors) declarations[color.name] = colorCss(color)
  Object.assign(
    declarations,
    theme.base,
    theme.density[config.density],
    theme.radius[config.radius],
    theme.motion[config.motion],
    config.tokens.both,
  )
  return Object.freeze(declarations)
}

const NEUTRAL_DERIVED = [
  '--vui-canvas',
  '--vui-surface',
  '--vui-elevated',
  '--vui-subtle',
  '--vui-inverted',
  '--vui-text',
  '--vui-text-muted',
  '--vui-text-subtle',
  '--vui-text-inverted',
  '--vui-border',
  '--vui-border-strong',
  '--vui-scrim',
  '--vui-shadow-color',
] as const satisfies readonly UiTokenName[]

function roleTokens(role: UiColorRole): UiTokenName[] {
  return [
    `--vui-${role}`,
    `--vui-${role}-hover`,
    `--vui-${role}-active`,
    `--vui-on-${role}`,
    `--vui-${role}-text`,
    `--vui-${role}-border`,
    `--vui-${role}-soft`,
    `--vui-${role}-soft-hover`,
  ]
}

/**
 * Custom properties for a *partial* override, suitable for the `themeVars`
 * prop of a nested `UiProvider`. Only tokens affected by the keys present in
 * `input` are returned, so everything else keeps inheriting from outside.
 */
export function createThemeVars(input: UiConfigInput<string>): UiDeclarations {
  const theme = resolveTheme(input)
  const all = themeToVars(theme)
  const names = new Set<UiTokenName>()

  for (const role of UI_COLOR_ROLES) {
    if (input.colors?.[role] === undefined) continue
    for (const name of roleTokens(role)) names.add(name)
    if (role === 'neutral') for (const name of NEUTRAL_DERIVED) names.add(name)
    if (role === 'info') names.add('--vui-focus')
  }
  const pickScale = (scale: UiDeclarations): void => {
    for (const name of Object.keys(scale) as UiTokenName[]) names.add(name)
  }
  if (input.density !== undefined) pickScale(theme.density[theme.config.density])
  if (input.radius !== undefined) pickScale(theme.radius[theme.config.radius])
  if (input.motion !== undefined) pickScale(theme.motion[theme.config.motion])
  if (input.fonts !== undefined) {
    for (const name of [
      '--vui-font-sans',
      '--vui-font-serif',
      '--vui-font-mono',
      '--vui-font-display',
    ] as const) {
      names.add(name)
    }
  }

  const result: Record<UiTokenName, string> = {}
  for (const name of names) {
    const value = all[name]
    if (value !== undefined) result[name] = value
  }
  // Scheme-specific raw overrides collapse into one light-dark() value.
  const { both, light, dark } = theme.config.tokens
  Object.assign(result, both)
  for (const name of new Set([...Object.keys(light), ...Object.keys(dark)]) as Set<UiTokenName>) {
    const lightValue = light[name] ?? both[name] ?? all[name]
    const darkValue = dark[name] ?? both[name] ?? all[name]
    if (lightValue !== undefined && darkValue !== undefined)
      result[name] = `light-dark(${lightValue}, ${darkValue})`
  }
  return Object.freeze(result)
}

function block(
  selector: string,
  declarations: UiDeclarations | Record<string, string>,
  indent = '  ',
): string {
  const lines = Object.entries(declarations).map(([name, value]) => `${indent}  ${name}: ${value};`)
  return `${indent}${selector} {\n${lines.join('\n')}\n${indent}}`
}

export interface ThemeCssOptions {
  /** Cascade layer that wraps the output. Default `theme.vui`. */
  readonly layer?: string
  /** Banner comment placed at the top of the file. */
  readonly banner?: string
}

/**
 * Serialise the resolved theme as the default stylesheet.
 *
 * Colours use `light-dark()`, so one declaration serves both schemes and a
 * nested `data-vui-theme` only has to change `color-scheme`. All selectors
 * are wrapped in `:where()` and sit in the lowest cascade layer the library
 * uses (`theme.vui`), so any consumer rule can override a token.
 */
export function themeToCss(theme: UiResolvedTheme, options: ThemeCssOptions = {}): string {
  const { config } = theme
  const layer = options.layer ?? 'theme.vui'
  const parts: string[] = []

  const root: Record<string, string> = {}
  if (config.colorMode === 'light') root['color-scheme'] = 'light'
  else if (config.colorMode === 'dark') root['color-scheme'] = 'dark'
  else if (config.colorMode === 'system') root['color-scheme'] = 'light dark'
  Object.assign(root, themeToVars(theme))

  // Scheme-specific raw overrides.
  const schemeOverrides: Record<string, string> = {}
  const { both, light, dark } = config.tokens
  for (const name of new Set([...Object.keys(light), ...Object.keys(dark)]) as Set<UiTokenName>) {
    const lightValue = light[name] ?? both[name] ?? root[name]
    const darkValue = dark[name] ?? both[name] ?? root[name]
    if (lightValue !== undefined && darkValue !== undefined) {
      schemeOverrides[name] = `light-dark(${lightValue}, ${darkValue})`
    }
  }
  Object.assign(root, schemeOverrides)

  parts.push(block(':where(:root, :host)', root))

  parts.push(
    block(":where([data-vui-theme='light'])", { 'color-scheme': 'light' }),
    block(":where([data-vui-theme='dark'])", { 'color-scheme': 'dark' }),
    block(":where([data-vui-theme='system'])", { 'color-scheme': 'light dark' }),
  )

  for (const [name, declarations] of Object.entries(theme.density)) {
    parts.push(block(`:where([data-vui-density='${name}'])`, declarations))
  }
  for (const [name, declarations] of Object.entries(theme.radius)) {
    parts.push(block(`:where([data-vui-radius='${name}'])`, declarations))
  }
  for (const [name, declarations] of Object.entries(theme.motion)) {
    parts.push(block(`:where([data-vui-motion='${name}'])`, declarations))
  }

  // Explicit, complete variant map: `data-color` selects which intent a
  // component paints with. No class names are ever assembled at runtime.
  for (const role of UI_COLOR_ROLES) {
    parts.push(
      block(`:where([class*='vui-'][data-color='${role}'])`, {
        '--vui-c': `var(--vui-${role})`,
        '--vui-c-hover': `var(--vui-${role}-hover)`,
        '--vui-c-active': `var(--vui-${role}-active)`,
        '--vui-c-on': `var(--vui-on-${role})`,
        '--vui-c-text': `var(--vui-${role}-text)`,
        '--vui-c-border': `var(--vui-${role}-border)`,
        '--vui-c-soft': `var(--vui-${role}-soft)`,
        '--vui-c-soft-hover': `var(--vui-${role}-soft-hover)`,
      }),
    )
  }

  parts.push(
    [
      '  /* Coarse pointers get a 44px minimum hit area (project target; WCAG 2.2 AA asks for 24px). */',
      '  @media (pointer: coarse) {',
      block(':where(:root, :host, [data-vui-density])', { '--vui-hit-min': '2.75rem' }, '    '),
      '  }',
    ].join('\n'),
    [
      '  @media (prefers-reduced-motion: reduce) {',
      block(
        ':where(:root, :host, [data-vui-motion])',
        { '--vui-duration-fast': '0ms', '--vui-duration-overlay': '0ms' },
        '    ',
      ),
      '  }',
    ].join('\n'),
  )

  const banner = options.banner ? `${options.banner}\n` : ''
  return `${banner}@layer ${layer} {\n${parts.join('\n\n')}\n}\n`
}

export interface UiContrastCheck {
  readonly id: string
  readonly scheme: UiScheme
  readonly ratio: number
  readonly required: number
  readonly pass: boolean
}

/**
 * Measure every default foreground/background combination the components
 * use. A perceptual colour model does not make a palette accessible by
 * itself, so this is asserted in the unit tests for the shipped theme.
 */
export function auditContrast(theme: UiResolvedTheme): UiContrastCheck[] {
  const byName = new Map(theme.colors.map((color) => [color.name, color]))
  const get = (name: UiTokenName): UiColorToken => {
    const color = byName.get(name)
    if (!color) throw new Error(`[@your-scope/theme] missing token ${name}`)
    return color
  }
  const checks: UiContrastCheck[] = []

  for (const scheme of ['light', 'dark'] as const) {
    const value = (name: UiTokenName): UiColorValue => get(name)[scheme]
    const solidRgb = (name: UiTokenName): Rgb => oklchToSrgb(value(name).oklch)
    const surfaces = (['canvas', 'surface', 'elevated', 'subtle'] as const).map((name) => ({
      name,
      rgb: solidRgb(`--vui-${name}`),
    }))
    const check = (id: string, foreground: Rgb, background: Rgb, required: number): void => {
      const ratio = contrastRatio(foreground, background)
      checks.push({ id, scheme, ratio, required, pass: ratio >= required })
    }

    for (const surface of surfaces) {
      for (const text of ['text', 'text-muted', 'text-subtle'] as const) {
        check(`${text} on ${surface.name}`, solidRgb(`--vui-${text}`), surface.rgb, AA_TEXT)
      }
      check(`border-strong vs ${surface.name}`, solidRgb('--vui-border-strong'), surface.rgb, AA_UI)
      check(`focus vs ${surface.name}`, solidRgb('--vui-focus'), surface.rgb, AA_UI)
    }
    check('text-inverted on inverted', solidRgb('--vui-text-inverted'), solidRgb('--vui-inverted'), AA_TEXT)

    for (const role of UI_COLOR_ROLES) {
      const on = solidRgb(`--vui-on-${role}`)
      for (const state of ['', '-hover', '-active'] as const) {
        check(`on-${role} on ${role}${state}`, on, solidRgb(`--vui-${role}${state}`), AA_TEXT)
      }
      const text = solidRgb(`--vui-${role}-text`)
      for (const surface of surfaces) {
        check(`${role} fill vs ${surface.name}`, solidRgb(`--vui-${role}`), surface.rgb, AA_UI)
        check(`${role}-text on ${surface.name}`, text, surface.rgb, AA_TEXT)
        check(`${role}-border vs ${surface.name}`, solidRgb(`--vui-${role}-border`), surface.rgb, AA_UI)
        for (const soft of ['soft', 'soft-hover'] as const) {
          const fill = flatten(value(`--vui-${role}-${soft}`), surface.rgb)
          check(`${role}-text on ${role}-${soft} over ${surface.name}`, text, fill, AA_TEXT)
        }
      }
    }
  }
  return checks
}
