import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import {
  SORA_COLOR_ROLES,
  SORA_SHADES,
  auditContrast,
  builtinPaletteNames,
  createPalette,
  createThemeVars,
  defaultSoraConfig,
  defineSoraConfig,
  isNeutralScale,
  normalizeSoraConfig,
  palettes,
  resolveTheme,
  themeToCss,
  themeToVars,
} from '@your-scope/theme'
import uiConfig from '../../sora.config.ts'

const failures = (input: Parameters<typeof resolveTheme>[0]) => {
  const theme = resolveTheme(input)
  return {
    warnings: theme.warnings,
    failed: auditContrast(theme)
      .filter((check) => !check.pass)
      .map((check) => `${check.scheme} ${check.id} ${check.ratio.toFixed(2)} < ${check.required}`),
  }
}

describe('palettes', () => {
  it('are complete eleven-step scales inside the sRGB gamut', () => {
    expect(builtinPaletteNames).toEqual([
      'neutral',
      'taupe',
      'terracotta',
      'green',
      'blue',
      'amber',
      'red',
      'violet',
      'teal',
    ])
    for (const name of builtinPaletteNames) {
      const scale = palettes[name]
      expect(Object.keys(scale).map(Number)).toEqual([...SORA_SHADES])
      let previous = Infinity
      for (const shade of SORA_SHADES) {
        const [lightness, chroma] = scale[shade]
        // Lightness falls monotonically from 50 to 950.
        expect(lightness).toBeLessThan(previous)
        previous = lightness
        expect(chroma).toBeGreaterThanOrEqual(0)
      }
    }
    expect(isNeutralScale(palettes.neutral)).toBe(true)
    expect(isNeutralScale(palettes.taupe)).toBe(true)
    expect(isNeutralScale(palettes.terracotta)).toBe(false)
  })
})

describe('configuration', () => {
  it('fills omitted options with the library defaults', () => {
    const config = normalizeSoraConfig({})
    expect(config.colors).toEqual(defaultSoraConfig.colors)
    expect(config.density).toBe('compact')
    expect(config.radius).toBe('md')
    expect(config.motion).toBe('subtle')
    expect(config.colorMode).toBe('inherit')
    expect(config.defaults.button).toEqual({ size: 'md', variant: 'solid', color: 'primary' })
  })

  it('merges component defaults per component', () => {
    const config = normalizeSoraConfig({ defaults: { button: { size: 'lg' }, card: { padding: 'lg' } } })
    expect(config.defaults.button).toEqual({ size: 'lg', variant: 'solid', color: 'primary' })
    expect(config.defaults.card).toEqual({ padding: 'lg', variant: 'outline' })
    expect(config.defaults.badge).toEqual(defaultSoraConfig.defaults.badge)
  })

  it('treats colour values as palette names, never as semantic aliases', () => {
    // `primary: 'neutral'` selects the neutral *palette* even though the
    // neutral *role* uses taupe.
    const theme = resolveTheme({ colors: { primary: 'neutral', neutral: 'taupe' } })
    const byName = new Map(theme.colors.map((color) => [color.name, color]))
    const primary = byName.get('--sora-primary')
    const neutralRole = byName.get('--sora-neutral')
    expect(primary?.light.oklch).toEqual(palettes.neutral[900])
    expect(neutralRole?.light.oklch).toEqual(palettes.taupe[900])
    expect(primary?.light.oklch).not.toEqual(neutralRole?.light.oklch)
  })

  it('rejects a value that is not a palette, naming the alternatives', () => {
    expect(() => normalizeSoraConfig({ colors: { primary: 'primary' as never } })).toThrow(/not a palette/)
    expect(() => normalizeSoraConfig({ colors: { primary: 'primary' as never } })).toThrow(/terracotta/)
  })

  it('accepts custom palettes declared in the same config', () => {
    const config = defineSoraConfig({
      palettes: { brand: createPalette({ hue: 310, chroma: 0.14 }) },
      colors: { primary: 'brand' },
    })
    const { warnings, failed } = failures(config)
    expect(warnings).toEqual([])
    expect(failed).toEqual([])
  })
})

describe('contrast of resolved themes', () => {
  it('passes every check for the shipped sora.config.ts with no warnings', () => {
    const theme = resolveTheme(uiConfig)
    const checks = auditContrast(theme)
    expect(theme.warnings).toEqual([])
    expect(checks.length).toBeGreaterThan(300)
    expect(checks.filter((check) => !check.pass)).toEqual([])
    // Both schemes are measured.
    expect(new Set(checks.map((check) => check.scheme))).toEqual(new Set(['light', 'dark']))
  })

  it.each(builtinPaletteNames.filter((name) => !isNeutralScale(palettes[name])))(
    'passes with the %s palette in every intent role',
    (palette) => {
      const colors = Object.fromEntries(
        SORA_COLOR_ROLES.filter((role) => role !== 'neutral').map((role) => [role, palette]),
      )
      expect(failures({ colors })).toEqual({ warnings: [], failed: [] })
    },
  )

  it.each(['neutral', 'taupe'] as const)('passes with %s as the surface/text palette', (palette) => {
    expect(failures({ colors: { neutral: palette, primary: palette } })).toEqual({ warnings: [], failed: [] })
  })

  it('reports (rather than hides) a palette that cannot reach its targets', () => {
    // A scale with almost no lightness range cannot produce readable text.
    const flat = Object.fromEntries(SORA_SHADES.map((shade) => [shade, [0.6, 0.1, 30] as const]))
    const theme = resolveTheme({ palettes: { flat: flat as never }, colors: { primary: 'flat' } })
    expect(theme.warnings.length).toBeGreaterThan(0)
    expect(auditContrast(theme).some((check) => !check.pass)).toBe(true)
  })
})

describe('serialisation', () => {
  const theme = resolveTheme(uiConfig)
  const css = themeToCss(theme)

  it('emits tokens once, in the lowest library layer, with light-dark() pairs', () => {
    expect(css.startsWith('@layer theme.sora {')).toBe(true)
    expect(css).toContain(':where(:root, :host) {')
    expect(css).toMatch(/--sora-canvas: light-dark\(oklch\([^)]+\), oklch\([^)]+\)\);/)
    expect(css.match(/--sora-canvas:/g)).toHaveLength(1)
    // Soft fills derive from the role token, so overriding the role alone stays coherent.
    expect(css).toContain(
      '--sora-primary-soft: light-dark(color-mix(in oklab, var(--sora-primary) 12%, transparent)',
    )
    // No scheme is forced unless the config asks for one.
    expect(css).not.toMatch(/:where\(:root, :host\) \{\s*color-scheme/)
  })

  it('has explicit, complete switches for scheme, density, radius, motion and intent', () => {
    for (const selector of [
      "[data-sora-theme='light']",
      "[data-sora-theme='dark']",
      "[data-sora-theme='system']",
      "[data-sora-density='compact']",
      "[data-sora-density='comfortable']",
      "[data-sora-radius='none']",
      "[data-sora-radius='lg']",
      "[data-sora-motion='none']",
      "[data-sora-motion='standard']",
    ]) {
      expect(css).toContain(selector)
    }
    for (const role of SORA_COLOR_ROLES) {
      expect(css).toContain(`[data-color='${role}']`)
      expect(css).toContain(`--sora-c: var(--sora-${role});`)
    }
    expect(css).toContain('@media (pointer: coarse)')
    expect(css).toContain('--sora-hit-min: 2.75rem')
    expect(css).toContain('@media (prefers-reduced-motion: reduce)')
  })

  it('applies the configured colour mode to the root when it is not "inherit"', () => {
    expect(themeToCss(resolveTheme({ colorMode: 'system' }))).toMatch(
      /:where\(:root, :host\) \{\s*color-scheme: light dark;/,
    )
    expect(themeToCss(resolveTheme({ colorMode: 'dark' }))).toMatch(
      /:where\(:root, :host\) \{\s*color-scheme: dark;/,
    )
  })

  it('changes the stylesheet when the configuration changes', () => {
    const comfortable = themeToVars(resolveTheme({ density: 'comfortable', radius: 'lg', motion: 'none' }))
    const compact = themeToVars(theme)
    expect(compact['--sora-control-md']).toBe('2.25rem')
    expect(comfortable['--sora-control-md']).toBe('2.5rem')
    expect(comfortable['--sora-radius-md']).toBe('0.75rem')
    expect(comfortable['--sora-duration-fast']).toBe('0ms')
    expect(themeToVars(resolveTheme({ colors: { secondary: 'violet' } }))['--sora-secondary']).not.toBe(
      compact['--sora-secondary'],
    )
  })

  it('matches the generated stylesheet committed in the ui package', async () => {
    const generated = await readFile(
      new URL('../../packages/ui/src/styles/theme.generated.css', import.meta.url),
      'utf8',
    )
    // Everything after the banner comment is exactly what the resolver produces.
    expect(generated.slice(generated.indexOf('@layer'))).toBe(css)
  })
})

describe('createThemeVars (nested provider overrides)', () => {
  it('returns only the tokens the override touches', () => {
    const vars = createThemeVars({ colors: { primary: 'violet' } })
    const names = Object.keys(vars)
    expect(names).toContain('--sora-primary')
    expect(names).toContain('--sora-on-primary')
    expect(names).toContain('--sora-primary-soft')
    // Nothing unrelated: outer overrides of these keep inheriting.
    expect(names.some((name) => name.startsWith('--sora-secondary'))).toBe(false)
    expect(names).not.toContain('--sora-canvas')
    expect(names).not.toContain('--sora-control-md')
  })

  it('includes surfaces and text when the neutral palette changes, and focus with info', () => {
    expect(Object.keys(createThemeVars({ colors: { neutral: 'neutral' } }))).toEqual(
      expect.arrayContaining(['--sora-canvas', '--sora-surface', '--sora-text', '--sora-border']),
    )
    expect(Object.keys(createThemeVars({ colors: { info: 'teal' } }))).toContain('--sora-focus')
  })

  it('covers density, radius, motion, fonts and raw token overrides', () => {
    const vars = createThemeVars({
      density: 'comfortable',
      radius: 'none',
      motion: 'standard',
      fonts: { display: 'serif' },
      tokens: { both: { '--sora-focus-width': '3px' }, dark: { '--sora-canvas': 'black' } },
    })
    expect(vars['--sora-control-md']).toBe('2.5rem')
    expect(vars['--sora-radius-md']).toBe('0px')
    expect(vars['--sora-duration-overlay']).toBe('180ms')
    expect(vars['--sora-font-display']).toBe('var(--sora-font-serif)')
    expect(vars['--sora-focus-width']).toBe('3px')
    expect(vars['--sora-canvas']).toMatch(/^light-dark\(.+, black\)$/)
  })
})
