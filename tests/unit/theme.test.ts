import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import {
  UI_COLOR_ROLES,
  UI_SHADES,
  auditContrast,
  builtinPaletteNames,
  createPalette,
  createThemeVars,
  defaultUiConfig,
  defineUiConfig,
  isNeutralScale,
  normalizeUiConfig,
  palettes,
  resolveTheme,
  themeToCss,
  themeToVars,
} from '@your-scope/theme'
import uiConfig from '../../ui.config.ts'

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
      expect(Object.keys(scale).map(Number)).toEqual([...UI_SHADES])
      let previous = Infinity
      for (const shade of UI_SHADES) {
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
    const config = normalizeUiConfig({})
    expect(config.colors).toEqual(defaultUiConfig.colors)
    expect(config.density).toBe('compact')
    expect(config.radius).toBe('md')
    expect(config.motion).toBe('subtle')
    expect(config.colorMode).toBe('inherit')
    expect(config.defaults.button).toEqual({ size: 'md', variant: 'solid', color: 'primary' })
  })

  it('merges component defaults per component', () => {
    const config = normalizeUiConfig({ defaults: { button: { size: 'lg' }, card: { padding: 'lg' } } })
    expect(config.defaults.button).toEqual({ size: 'lg', variant: 'solid', color: 'primary' })
    expect(config.defaults.card).toEqual({ padding: 'lg', variant: 'outline' })
    expect(config.defaults.badge).toEqual(defaultUiConfig.defaults.badge)
  })

  it('treats colour values as palette names, never as semantic aliases', () => {
    // `primary: 'neutral'` selects the neutral *palette* even though the
    // neutral *role* uses taupe.
    const theme = resolveTheme({ colors: { primary: 'neutral', neutral: 'taupe' } })
    const byName = new Map(theme.colors.map((color) => [color.name, color]))
    const primary = byName.get('--vui-primary')
    const neutralRole = byName.get('--vui-neutral')
    expect(primary?.light.oklch).toEqual(palettes.neutral[900])
    expect(neutralRole?.light.oklch).toEqual(palettes.taupe[900])
    expect(primary?.light.oklch).not.toEqual(neutralRole?.light.oklch)
  })

  it('rejects a value that is not a palette, naming the alternatives', () => {
    expect(() => normalizeUiConfig({ colors: { primary: 'primary' as never } })).toThrow(/not a palette/)
    expect(() => normalizeUiConfig({ colors: { primary: 'primary' as never } })).toThrow(/terracotta/)
  })

  it('accepts custom palettes declared in the same config', () => {
    const config = defineUiConfig({
      palettes: { brand: createPalette({ hue: 310, chroma: 0.14 }) },
      colors: { primary: 'brand' },
    })
    const { warnings, failed } = failures(config)
    expect(warnings).toEqual([])
    expect(failed).toEqual([])
  })
})

describe('contrast of resolved themes', () => {
  it('passes every check for the shipped ui.config.ts with no warnings', () => {
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
        UI_COLOR_ROLES.filter((role) => role !== 'neutral').map((role) => [role, palette]),
      )
      expect(failures({ colors })).toEqual({ warnings: [], failed: [] })
    },
  )

  it.each(['neutral', 'taupe'] as const)('passes with %s as the surface/text palette', (palette) => {
    expect(failures({ colors: { neutral: palette, primary: palette } })).toEqual({ warnings: [], failed: [] })
  })

  it('reports (rather than hides) a palette that cannot reach its targets', () => {
    // A scale with almost no lightness range cannot produce readable text.
    const flat = Object.fromEntries(UI_SHADES.map((shade) => [shade, [0.6, 0.1, 30] as const]))
    const theme = resolveTheme({ palettes: { flat: flat as never }, colors: { primary: 'flat' } })
    expect(theme.warnings.length).toBeGreaterThan(0)
    expect(auditContrast(theme).some((check) => !check.pass)).toBe(true)
  })
})

describe('serialisation', () => {
  const theme = resolveTheme(uiConfig)
  const css = themeToCss(theme)

  it('emits tokens once, in the lowest library layer, with light-dark() pairs', () => {
    expect(css.startsWith('@layer theme.vui {')).toBe(true)
    expect(css).toContain(':where(:root, :host) {')
    expect(css).toMatch(/--vui-canvas: light-dark\(oklch\([^)]+\), oklch\([^)]+\)\);/)
    expect(css.match(/--vui-canvas:/g)).toHaveLength(1)
    // Soft fills derive from the role token, so overriding the role alone stays coherent.
    expect(css).toContain(
      '--vui-primary-soft: light-dark(color-mix(in oklab, var(--vui-primary) 12%, transparent)',
    )
    // No scheme is forced unless the config asks for one.
    expect(css).not.toMatch(/:where\(:root, :host\) \{\s*color-scheme/)
  })

  it('has explicit, complete switches for scheme, density, radius, motion and intent', () => {
    for (const selector of [
      "[data-vui-theme='light']",
      "[data-vui-theme='dark']",
      "[data-vui-theme='system']",
      "[data-vui-density='compact']",
      "[data-vui-density='comfortable']",
      "[data-vui-radius='none']",
      "[data-vui-radius='lg']",
      "[data-vui-motion='none']",
      "[data-vui-motion='standard']",
    ]) {
      expect(css).toContain(selector)
    }
    for (const role of UI_COLOR_ROLES) {
      expect(css).toContain(`[data-color='${role}']`)
      expect(css).toContain(`--vui-c: var(--vui-${role});`)
    }
    expect(css).toContain('@media (pointer: coarse)')
    expect(css).toContain('--vui-hit-min: 2.75rem')
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
    expect(compact['--vui-control-md']).toBe('2.25rem')
    expect(comfortable['--vui-control-md']).toBe('2.5rem')
    expect(comfortable['--vui-radius-md']).toBe('0.75rem')
    expect(comfortable['--vui-duration-fast']).toBe('0ms')
    expect(themeToVars(resolveTheme({ colors: { secondary: 'violet' } }))['--vui-secondary']).not.toBe(
      compact['--vui-secondary'],
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
    expect(names).toContain('--vui-primary')
    expect(names).toContain('--vui-on-primary')
    expect(names).toContain('--vui-primary-soft')
    // Nothing unrelated: outer overrides of these keep inheriting.
    expect(names.some((name) => name.startsWith('--vui-secondary'))).toBe(false)
    expect(names).not.toContain('--vui-canvas')
    expect(names).not.toContain('--vui-control-md')
  })

  it('includes surfaces and text when the neutral palette changes, and focus with info', () => {
    expect(Object.keys(createThemeVars({ colors: { neutral: 'neutral' } }))).toEqual(
      expect.arrayContaining(['--vui-canvas', '--vui-surface', '--vui-text', '--vui-border']),
    )
    expect(Object.keys(createThemeVars({ colors: { info: 'teal' } }))).toContain('--vui-focus')
  })

  it('covers density, radius, motion, fonts and raw token overrides', () => {
    const vars = createThemeVars({
      density: 'comfortable',
      radius: 'none',
      motion: 'standard',
      fonts: { display: 'serif' },
      tokens: { both: { '--vui-focus-width': '3px' }, dark: { '--vui-canvas': 'black' } },
    })
    expect(vars['--vui-control-md']).toBe('2.5rem')
    expect(vars['--vui-radius-md']).toBe('0px')
    expect(vars['--vui-duration-overlay']).toBe('180ms')
    expect(vars['--vui-font-display']).toBe('var(--vui-font-serif)')
    expect(vars['--vui-focus-width']).toBe('3px')
    expect(vars['--vui-canvas']).toMatch(/^light-dark\(.+, black\)$/)
  })
})
