/**
 * @your-scope/ui/theme: runtime theming helpers.
 *
 * Optional entry. It pulls in the palettes and the resolver from
 * `@your-scope/theme`, which the core entry never does: applications that are
 * happy with the generated stylesheet do not pay for them.
 */
import { createThemeVars } from '@your-scope/theme'
import type { UiConfigInput } from '@your-scope/theme'
import type { UiProviderProps } from '../components/foundation/UiProvider.vue'

export {
  auditContrast,
  builtinPaletteNames,
  createPalette,
  createThemeVars,
  defineUiConfig,
  palettes,
  resolveTheme,
  themeToCss,
  themeToVars,
} from '@your-scope/theme'
export type {
  UiBuiltinPalette,
  UiColorMode,
  UiConfig,
  UiConfigInput,
  UiContrastCheck,
  UiDeclarations,
  UiPaletteScale,
  UiResolvedTheme,
} from '@your-scope/theme'

export type UiProviderTheme = Pick<
  UiProviderProps,
  'themeVars' | 'density' | 'radius' | 'motion' | 'defaults' | 'colorMode'
>

/**
 * Turn a partial `ui.config.ts`-style object into props for a (nested)
 * `UiProvider`:
 *
 * ```vue
 * <UiProvider v-bind="createProviderTheme({ colors: { primary: 'violet' }, density: 'comfortable' })">
 * ```
 *
 * Only what the object mentions is overridden; everything else keeps
 * inheriting from the surrounding provider or the stylesheet.
 */
export function createProviderTheme(input: UiConfigInput<string>): UiProviderTheme {
  const theme: UiProviderTheme = {}
  // Density, radius and motion are attribute switches in the stylesheet, so they need no variables.
  const { density, radius, motion, defaults, colorMode, ...colorsAndTokens } = input
  const vars = createThemeVars(colorsAndTokens)
  if (Object.keys(vars).length > 0) theme.themeVars = vars
  if (density !== undefined) theme.density = density
  if (radius !== undefined) theme.radius = radius
  if (motion !== undefined) theme.motion = motion
  if (defaults !== undefined) theme.defaults = defaults
  if (colorMode !== undefined && colorMode !== 'inherit') theme.colorMode = colorMode
  return theme
}
