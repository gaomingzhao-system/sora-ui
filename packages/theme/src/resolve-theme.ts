import { contrastRatio, flatten, formatOklch, oklchToSrgb, type Rgb } from './color.ts'
import { normalizeSoraConfig } from './define-sora-config.ts'
import { springEasing } from './motion.ts'
import { isNeutralScale } from './palettes.ts'
import {
  SORA_COLOR_ROLES,
  type Oklch,
  type SoraColorRole,
  type SoraColorValue,
  type SoraConfig,
  type SoraConfigInput,
  type SoraDensity,
  type SoraMotion,
  type SoraPaletteScale,
  type SoraRadius,
  type SoraScheme,
  type SoraShade,
} from './types.ts'

export type SoraTokenName = `--sora-${string}`
export type SoraDeclarations = Readonly<Record<SoraTokenName, string>>

/** A colour token: numeric values per scheme plus the CSS that expresses it. */
export interface SoraColorToken {
  readonly name: SoraTokenName
  readonly light: SoraColorValue
  readonly dark: SoraColorValue
  /**
   * CSS expression used instead of a literal `light-dark()` pair, for tokens
   * derived from another token (soft fills are `color-mix()` over the role).
   */
  readonly expression?: string
}

export interface SoraResolvedTheme {
  readonly config: SoraConfig
  readonly colors: readonly SoraColorToken[]
  /** Scheme-independent tokens that do not depend on density/radius/motion. */
  readonly base: SoraDeclarations
  readonly density: Readonly<Record<SoraDensity, SoraDeclarations>>
  readonly radius: Readonly<Record<SoraRadius, SoraDeclarations>>
  readonly motion: Readonly<Record<SoraMotion, SoraDeclarations>>
  /** Non-fatal problems, e.g. a palette that cannot reach a contrast target. */
  readonly warnings: readonly string[]
}

const WHITE: Oklch = [1, 0, 0]
const AA_TEXT = 4.5
const AA_UI = 3

const SOFT_ALPHA: Readonly<Record<SoraScheme, number>> = { light: 0.12, dark: 0.16 }
const SOFT_HOVER_ALPHA: Readonly<Record<SoraScheme, number>> = { light: 0.2, dark: 0.26 }

const opaque = (oklch: Oklch): SoraColorValue => ({ oklch, alpha: 1 })

const translucent = (oklch: Oklch, alpha: number): SoraColorValue => ({ oklch, alpha })

interface SchemeSurfaces {
  canvas: Oklch
  surface: Oklch
  elevated: Oklch
  subtle: Oklch
}

const surfacesOf = (neutral: SoraPaletteScale, scheme: SoraScheme): SchemeSurfaces =>
  scheme === 'light'
    ? { canvas: neutral[50], surface: WHITE, elevated: WHITE, subtle: neutral[100] }
    : { canvas: neutral[950], surface: neutral[900], elevated: neutral[800], subtle: neutral[800] }

const backgroundsOf = (surfaces: SchemeSurfaces): Rgb[] =>
  [surfaces.canvas, surfaces.surface, surfaces.elevated, surfaces.subtle].map(oklchToSrgb)

const minContrast = (color: Oklch, backgrounds: readonly Rgb[]): number => {
  const rgb = oklchToSrgb(color)
  return Math.min(...backgrounds.map((background) => contrastRatio(rgb, background)))
}

/**
 * First shade (in preference order) whose worst-case contrast reaches the
 * target; otherwise the best available shade plus a warning.
 */
const pickShade = (
  scale: SoraPaletteScale,
  candidates: readonly SoraShade[],
  score: (color: Oklch) => number,
  target: number,
  describe: string,
  warnings: string[],
): Oklch => {
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

const resolveRole = (
  role: SoraColorRole,
  scale: SoraPaletteScale,
  scheme: SoraScheme,
  surfaces: SchemeSurfaces,
  warnings: string[],
): RoleScheme => {
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
  const ladders: Readonly<Record<SoraScheme, readonly (readonly [SoraShade, SoraShade, SoraShade])[]>> =
    neutral
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
  const textCandidates: readonly SoraShade[] =
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

  const borderCandidates: readonly SoraShade[] = scheme === 'light' ? [500, 600, 700] : [500, 400, 300]
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

/** Soft fills follow the role token, so overriding `--sora-<role>` alone stays coherent. */
const softExpression = (role: SoraColorRole, alpha: Readonly<Record<SoraScheme, number>>): string => {
  const mix = (scheme: SoraScheme): string =>
    `color-mix(in oklab, var(--sora-${role}) ${Math.round(alpha[scheme] * 100)}%, transparent)`
  return `light-dark(${mix('light')}, ${mix('dark')})`
}

const token = (
  name: SoraTokenName,
  light: SoraColorValue,
  dark: SoraColorValue,
  expression?: string,
): SoraColorToken => (expression === undefined ? { name, light, dark } : { name, light, dark, expression })

const DENSITY: Readonly<Record<SoraDensity, SoraDeclarations>> = {
  compact: {
    '--sora-control-sm': '1.75rem',
    '--sora-control-md': '2.25rem',
    '--sora-control-lg': '2.5rem',
    '--sora-space-unit': '0.25rem',
    '--sora-gap-xs': '0.25rem',
    '--sora-gap-sm': '0.5rem',
    '--sora-gap-md': '0.75rem',
    '--sora-gap-lg': '1rem',
    '--sora-pad-sm': '0.5rem',
    '--sora-pad-md': '0.75rem',
    '--sora-pad-lg': '1rem',
    '--sora-pad-overlay': '1rem',
    '--sora-row': '2.25rem',
  },
  comfortable: {
    '--sora-control-sm': '2rem',
    '--sora-control-md': '2.5rem',
    '--sora-control-lg': '2.75rem',
    '--sora-space-unit': '0.25rem',
    '--sora-gap-xs': '0.375rem',
    '--sora-gap-sm': '0.625rem',
    '--sora-gap-md': '1rem',
    '--sora-gap-lg': '1.25rem',
    '--sora-pad-sm': '0.75rem',
    '--sora-pad-md': '1rem',
    '--sora-pad-lg': '1.25rem',
    '--sora-pad-overlay': '1.25rem',
    '--sora-row': '2.75rem',
  },
}

const RADIUS: Readonly<Record<SoraRadius, SoraDeclarations>> = {
  none: { '--sora-radius-sm': '0px', '--sora-radius-md': '0px', '--sora-radius-lg': '0px' },
  sm: { '--sora-radius-sm': '0.25rem', '--sora-radius-md': '0.375rem', '--sora-radius-lg': '0.625rem' },
  md: { '--sora-radius-sm': '0.4375rem', '--sora-radius-md': '0.625rem', '--sora-radius-lg': '0.875rem' },
  lg: { '--sora-radius-sm': '0.5rem', '--sora-radius-md': '0.75rem', '--sora-radius-lg': '1.125rem' },
}

const MOTION: Readonly<Record<SoraMotion, SoraDeclarations>> = {
  none: { '--sora-duration-fast': '0ms', '--sora-duration-overlay': '0ms', '--sora-duration-sheet': '0ms' },
  // Spring easings settle asymptotically, so these read shorter than they are.
  subtle: {
    '--sora-duration-fast': '150ms',
    '--sora-duration-overlay': '280ms',
    '--sora-duration-sheet': '420ms',
  },
  standard: {
    '--sora-duration-fast': '180ms',
    '--sora-duration-overlay': '360ms',
    '--sora-duration-sheet': '520ms',
  },
}

/** Turn a (partial) configuration into measurable, serialisable tokens. */
export const resolveTheme = (input: SoraConfigInput<string> = {}): SoraResolvedTheme => {
  const config = normalizeSoraConfig(input)
  const warnings: string[] = []
  const scaleOf = (role: SoraColorRole): SoraPaletteScale => {
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

  const colors: SoraColorToken[] = []
  const add = (name: SoraTokenName, lightValue: Oklch, darkValue: Oklch): void => {
    colors.push(token(name, opaque(lightValue), opaque(darkValue)))
  }
  const pair = (
    name: string,
    lightCandidates: readonly SoraShade[],
    darkCandidates: readonly SoraShade[],
    target: number,
    scale: SoraPaletteScale = neutral,
  ): void => {
    add(
      `--sora-${name}`,
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
  add('--sora-canvas', light.canvas, dark.canvas)
  add('--sora-surface', light.surface, dark.surface)
  add('--sora-elevated', light.elevated, dark.elevated)
  add('--sora-subtle', light.subtle, dark.subtle)
  add('--sora-inverted', neutral[900], neutral[100])

  // Text
  pair('text', [950, 900], [50, 100], 7)
  pair('text-muted', [700, 800], [300, 200], AA_TEXT)
  pair('text-subtle', [600, 700], [400, 300], AA_TEXT)
  add('--sora-text-inverted', neutral[50], neutral[950])

  // Boundaries
  add('--sora-border', neutral[200], neutral[700])
  pair('border-strong', [500, 600], [500, 400], AA_UI)
  pair('focus', [600, 700], [400, 300], AA_UI, info)

  // Intents
  for (const role of SORA_COLOR_ROLES) {
    const scale = scaleOf(role)
    const l = resolveRole(role, scale, 'light', light, warnings)
    const d = resolveRole(role, scale, 'dark', dark, warnings)
    add(`--sora-${role}`, l.solid, d.solid)
    add(`--sora-${role}-hover`, l.hover, d.hover)
    add(`--sora-${role}-active`, l.active, d.active)
    add(`--sora-on-${role}`, l.on, d.on)
    add(`--sora-${role}-text`, l.text, d.text)
    add(`--sora-${role}-border`, l.border, d.border)
    colors.push(
      token(
        `--sora-${role}-soft`,
        translucent(l.solid, SOFT_ALPHA.light),
        translucent(d.solid, SOFT_ALPHA.dark),
        softExpression(role, SOFT_ALPHA),
      ),
      token(
        `--sora-${role}-soft-hover`,
        translucent(l.solid, SOFT_HOVER_ALPHA.light),
        translucent(d.solid, SOFT_HOVER_ALPHA.dark),
        softExpression(role, SOFT_HOVER_ALPHA),
      ),
    )
  }

  // Overlays and elevation
  colors.push(
    token('--sora-scrim', translucent(neutral[950], 0.42), translucent([0.12, 0.004, neutral[950][2]], 0.62)),
    token('--sora-shadow-color', translucent(neutral[950], 0.14), translucent([0, 0, 0], 0.5)),
  )

  const fonts = config.fonts
  const base: SoraDeclarations = {
    '--sora-font-sans': fonts.sans,
    '--sora-font-serif': fonts.serif,
    '--sora-font-mono': fonts.mono,
    '--sora-font-display': fonts.display === 'serif' ? 'var(--sora-font-serif)' : 'var(--sora-font-sans)',
    '--sora-text-xs': '0.75rem',
    '--sora-text-sm': '0.8125rem',
    '--sora-text-md': '0.875rem',
    '--sora-text-lg': '1rem',
    '--sora-text-xl': '1.125rem',
    '--sora-text-2xl': '1.375rem',
    '--sora-leading-tight': '1.25',
    '--sora-leading-normal': '1.5',
    '--sora-weight-normal': '400',
    '--sora-weight-medium': '500',
    '--sora-weight-semibold': '600',
    '--sora-radius-full': '9999px',
    '--sora-border-width': '1px',
    '--sora-focus-width': '2px',
    '--sora-focus-offset': '2px',
    '--sora-ease-out': 'cubic-bezier(0.2, 0, 0, 1)',
    '--sora-ease-in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
    // Springs, as iOS uses them: one that settles without overshoot, one with a small bounce.
    '--sora-ease-spring': springEasing(1),
    '--sora-ease-bounce': springEasing(0.72),
    // The curve UIKit sheets settle with.
    '--sora-ease-sheet': 'cubic-bezier(0.32, 0.72, 0, 1)',
    '--sora-hover': 'color-mix(in oklab, var(--sora-text) 7%, transparent)',
    '--sora-pressed': 'color-mix(in oklab, var(--sora-text) 12%, transparent)',
    '--sora-shadow-sm': '0 1px 2px var(--sora-shadow-color)',
    '--sora-shadow-md': '0 1px 3px var(--sora-shadow-color), 0 6px 16px -4px var(--sora-shadow-color)',
    '--sora-shadow-lg': '0 2px 6px var(--sora-shadow-color), 0 16px 40px -12px var(--sora-shadow-color)',
    '--sora-disabled-opacity': '0.55',
    /** Minimum hit area; raised to 44px for coarse pointers in the generated CSS. */
    '--sora-hit-min': '0px',
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

const colorCss = (color: SoraColorToken): string => {
  if (color.expression !== undefined) return color.expression
  const lightCss = formatOklch(color.light.oklch, color.light.alpha)
  const darkCss = formatOklch(color.dark.oklch, color.dark.alpha)
  return lightCss === darkCss ? lightCss : `light-dark(${lightCss}, ${darkCss})`
}

/** Every declaration of the resolved theme for the configured density/radius/motion. */
export const themeToVars = (theme: SoraResolvedTheme): SoraDeclarations => {
  const { config } = theme
  const declarations: Record<SoraTokenName, string> = {}
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
  '--sora-canvas',
  '--sora-surface',
  '--sora-elevated',
  '--sora-subtle',
  '--sora-inverted',
  '--sora-text',
  '--sora-text-muted',
  '--sora-text-subtle',
  '--sora-text-inverted',
  '--sora-border',
  '--sora-border-strong',
  '--sora-scrim',
  '--sora-shadow-color',
] as const satisfies readonly SoraTokenName[]

const roleTokens = (role: SoraColorRole): SoraTokenName[] => [
  `--sora-${role}`,
  `--sora-${role}-hover`,
  `--sora-${role}-active`,
  `--sora-on-${role}`,
  `--sora-${role}-text`,
  `--sora-${role}-border`,
  `--sora-${role}-soft`,
  `--sora-${role}-soft-hover`,
]

/**
 * Custom properties for a *partial* override, suitable for the `themeVars`
 * prop of a nested `SoraProvider`. Only tokens affected by the keys present in
 * `input` are returned, so everything else keeps inheriting from outside.
 */
export const createThemeVars = (input: SoraConfigInput<string>): SoraDeclarations => {
  const theme = resolveTheme(input)
  const all = themeToVars(theme)
  const names = new Set<SoraTokenName>()

  for (const role of SORA_COLOR_ROLES) {
    if (input.colors?.[role] === undefined) continue
    for (const name of roleTokens(role)) names.add(name)
    if (role === 'neutral') for (const name of NEUTRAL_DERIVED) names.add(name)
    if (role === 'info') names.add('--sora-focus')
  }
  const pickScale = (scale: SoraDeclarations): void => {
    for (const name of Object.keys(scale) as SoraTokenName[]) names.add(name)
  }
  if (input.density !== undefined) pickScale(theme.density[theme.config.density])
  if (input.radius !== undefined) pickScale(theme.radius[theme.config.radius])
  if (input.motion !== undefined) pickScale(theme.motion[theme.config.motion])
  if (input.fonts !== undefined) {
    for (const name of [
      '--sora-font-sans',
      '--sora-font-serif',
      '--sora-font-mono',
      '--sora-font-display',
    ] as const) {
      names.add(name)
    }
  }

  const result: Record<SoraTokenName, string> = {}
  for (const name of names) {
    const value = all[name]
    if (value !== undefined) result[name] = value
  }
  // Scheme-specific raw overrides collapse into one light-dark() value.
  const { both, light, dark } = theme.config.tokens
  Object.assign(result, both)
  for (const name of new Set([...Object.keys(light), ...Object.keys(dark)]) as Set<SoraTokenName>) {
    const lightValue = light[name] ?? both[name] ?? all[name]
    const darkValue = dark[name] ?? both[name] ?? all[name]
    if (lightValue !== undefined && darkValue !== undefined)
      result[name] = `light-dark(${lightValue}, ${darkValue})`
  }
  return Object.freeze(result)
}

const block = (
  selector: string,
  declarations: SoraDeclarations | Record<string, string>,
  indent = '  ',
): string => {
  const lines = Object.entries(declarations).map(([name, value]) => `${indent}  ${name}: ${value};`)
  return `${indent}${selector} {\n${lines.join('\n')}\n${indent}}`
}

export interface ThemeCssOptions {
  /** Cascade layer that wraps the output. Default `theme.sora`. */
  readonly layer?: string
  /** Banner comment placed at the top of the file. */
  readonly banner?: string
}

/**
 * Serialise the resolved theme as the default stylesheet.
 *
 * Colours use `light-dark()`, so one declaration serves both schemes and a
 * nested `data-sora-theme` only has to change `color-scheme`. All selectors
 * are wrapped in `:where()` and sit in the lowest cascade layer the library
 * uses (`theme.sora`), so any consumer rule can override a token.
 */
export const themeToCss = (theme: SoraResolvedTheme, options: ThemeCssOptions = {}): string => {
  const { config } = theme
  const layer = options.layer ?? 'theme.sora'
  const parts: string[] = []

  const root: Record<string, string> = {}
  if (config.colorMode === 'light') root['color-scheme'] = 'light'
  else if (config.colorMode === 'dark') root['color-scheme'] = 'dark'
  else if (config.colorMode === 'system') root['color-scheme'] = 'light dark'
  Object.assign(root, themeToVars(theme))

  // Scheme-specific raw overrides.
  const schemeOverrides: Record<string, string> = {}
  const { both, light, dark } = config.tokens
  for (const name of new Set([...Object.keys(light), ...Object.keys(dark)]) as Set<SoraTokenName>) {
    const lightValue = light[name] ?? both[name] ?? root[name]
    const darkValue = dark[name] ?? both[name] ?? root[name]
    if (lightValue !== undefined && darkValue !== undefined) {
      schemeOverrides[name] = `light-dark(${lightValue}, ${darkValue})`
    }
  }
  Object.assign(root, schemeOverrides)

  parts.push(block(':where(:root, :host)', root))

  parts.push(
    block(":where([data-sora-theme='light'])", { 'color-scheme': 'light' }),
    block(":where([data-sora-theme='dark'])", { 'color-scheme': 'dark' }),
    block(":where([data-sora-theme='system'])", { 'color-scheme': 'light dark' }),
  )

  for (const [name, declarations] of Object.entries(theme.density)) {
    parts.push(block(`:where([data-sora-density='${name}'])`, declarations))
  }
  for (const [name, declarations] of Object.entries(theme.radius)) {
    parts.push(block(`:where([data-sora-radius='${name}'])`, declarations))
  }
  for (const [name, declarations] of Object.entries(theme.motion)) {
    parts.push(block(`:where([data-sora-motion='${name}'])`, declarations))
  }

  // Explicit, complete variant map: `data-color` selects which intent a
  // component paints with. No class names are ever assembled at runtime.
  for (const role of SORA_COLOR_ROLES) {
    parts.push(
      block(`:where([class*='sora-'][data-color='${role}'])`, {
        '--sora-c': `var(--sora-${role})`,
        '--sora-c-hover': `var(--sora-${role}-hover)`,
        '--sora-c-active': `var(--sora-${role}-active)`,
        '--sora-c-on': `var(--sora-on-${role})`,
        '--sora-c-text': `var(--sora-${role}-text)`,
        '--sora-c-border': `var(--sora-${role}-border)`,
        '--sora-c-soft': `var(--sora-${role}-soft)`,
        '--sora-c-soft-hover': `var(--sora-${role}-soft-hover)`,
      }),
    )
  }

  parts.push(
    [
      '  /* Coarse pointers get a 44px minimum hit area (project target; WCAG 2.2 AA asks for 24px). */',
      '  @media (pointer: coarse) {',
      block(':where(:root, :host, [data-sora-density])', { '--sora-hit-min': '2.75rem' }, '    '),
      '  }',
    ].join('\n'),
    [
      '  @media (prefers-reduced-motion: reduce) {',
      block(
        ':where(:root, :host, [data-sora-motion])',
        { '--sora-duration-fast': '0ms', '--sora-duration-overlay': '0ms', '--sora-duration-sheet': '0ms' },
        '    ',
      ),
      '  }',
    ].join('\n'),
  )

  const banner = options.banner ? `${options.banner}\n` : ''
  return `${banner}@layer ${layer} {\n${parts.join('\n\n')}\n}\n`
}

export interface SoraContrastCheck {
  readonly id: string
  readonly scheme: SoraScheme
  readonly ratio: number
  readonly required: number
  readonly pass: boolean
}

/**
 * Measure every default foreground/background combination the components
 * use. A perceptual colour model does not make a palette accessible by
 * itself, so this is asserted in the unit tests for the shipped theme.
 */
export const auditContrast = (theme: SoraResolvedTheme): SoraContrastCheck[] => {
  const byName = new Map(theme.colors.map((color) => [color.name, color]))
  const get = (name: SoraTokenName): SoraColorToken => {
    const color = byName.get(name)
    if (!color) throw new Error(`[@your-scope/theme] missing token ${name}`)
    return color
  }
  const checks: SoraContrastCheck[] = []

  for (const scheme of ['light', 'dark'] as const) {
    const value = (name: SoraTokenName): SoraColorValue => get(name)[scheme]
    const solidRgb = (name: SoraTokenName): Rgb => oklchToSrgb(value(name).oklch)
    const surfaces = (['canvas', 'surface', 'elevated', 'subtle'] as const).map((name) => ({
      name,
      rgb: solidRgb(`--sora-${name}`),
    }))
    const check = (id: string, foreground: Rgb, background: Rgb, required: number): void => {
      const ratio = contrastRatio(foreground, background)
      checks.push({ id, scheme, ratio, required, pass: ratio >= required })
    }

    for (const surface of surfaces) {
      for (const text of ['text', 'text-muted', 'text-subtle'] as const) {
        check(`${text} on ${surface.name}`, solidRgb(`--sora-${text}`), surface.rgb, AA_TEXT)
      }
      check(`border-strong vs ${surface.name}`, solidRgb('--sora-border-strong'), surface.rgb, AA_UI)
      check(`focus vs ${surface.name}`, solidRgb('--sora-focus'), surface.rgb, AA_UI)
    }
    check('text-inverted on inverted', solidRgb('--sora-text-inverted'), solidRgb('--sora-inverted'), AA_TEXT)

    for (const role of SORA_COLOR_ROLES) {
      const on = solidRgb(`--sora-on-${role}`)
      for (const state of ['', '-hover', '-active'] as const) {
        check(`on-${role} on ${role}${state}`, on, solidRgb(`--sora-${role}${state}`), AA_TEXT)
      }
      const text = solidRgb(`--sora-${role}-text`)
      for (const surface of surfaces) {
        check(`${role} fill vs ${surface.name}`, solidRgb(`--sora-${role}`), surface.rgb, AA_UI)
        check(`${role}-text on ${surface.name}`, text, surface.rgb, AA_TEXT)
        check(`${role}-border vs ${surface.name}`, solidRgb(`--sora-${role}-border`), surface.rgb, AA_UI)
        for (const soft of ['soft', 'soft-hover'] as const) {
          const fill = flatten(value(`--sora-${role}-${soft}`), surface.rgb)
          check(`${role}-text on ${role}-${soft} over ${surface.name}`, text, fill, AA_TEXT)
        }
      }
    }
  }
  return checks
}
