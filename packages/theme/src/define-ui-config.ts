import { defaultUiConfig } from './defaults.ts'
import { palettes } from './palettes.ts'
import { UI_COLOR_ROLES } from './types.ts'
import type { UiComponentDefaults, UiConfig, UiConfigInput } from './types.ts'

/**
 * Identity helper that types `ui.config.ts`.
 *
 * `colors` values are checked against the built-in palettes plus any palette
 * declared under `palettes`, so a typo fails to compile.
 */
export function defineUiConfig<const TPalette extends string = never>(
  config: UiConfigInput<TPalette>,
): UiConfigInput<TPalette> {
  return config
}

function mergeDefaults(input: UiConfigInput<string>['defaults']): UiComponentDefaults {
  const base = defaultUiConfig.defaults
  const merged = {} as { -readonly [K in keyof UiComponentDefaults]: UiComponentDefaults[K] }
  for (const key of Object.keys(base) as (keyof UiComponentDefaults)[]) {
    Object.assign(merged, { [key]: Object.freeze({ ...base[key], ...input?.[key] }) })
  }
  return Object.freeze(merged)
}

/** Fill every omitted option and validate palette references. */
export function normalizeUiConfig(input: UiConfigInput<string> = {}): UiConfig {
  const allPalettes = { ...palettes, ...input.palettes }
  const colors = { ...defaultUiConfig.colors, ...input.colors }

  for (const role of UI_COLOR_ROLES) {
    const name = colors[role]
    if (!(name in allPalettes)) {
      const known = Object.keys(allPalettes).join(', ')
      throw new Error(
        `[@your-scope/theme] colors.${role} = "${name}" is not a palette. ` +
          `Values name palettes, not semantic roles. Known palettes: ${known}.`,
      )
    }
  }

  return Object.freeze({
    colors: Object.freeze(colors),
    palettes: Object.freeze(allPalettes),
    colorMode: input.colorMode ?? defaultUiConfig.colorMode,
    density: input.density ?? defaultUiConfig.density,
    radius: input.radius ?? defaultUiConfig.radius,
    motion: input.motion ?? defaultUiConfig.motion,
    fonts: Object.freeze({ ...defaultUiConfig.fonts, ...input.fonts }),
    defaults: mergeDefaults(input.defaults),
    tokens: Object.freeze({
      both: Object.freeze({ ...input.tokens?.both }),
      light: Object.freeze({ ...input.tokens?.light }),
      dark: Object.freeze({ ...input.tokens?.dark }),
    }),
  })
}
