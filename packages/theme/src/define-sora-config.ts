import { defaultSoraConfig } from './defaults.ts'
import { palettes } from './palettes.ts'
import { SORA_COLOR_ROLES } from './types.ts'
import type { SoraComponentDefaults, SoraConfig, SoraConfigInput } from './types.ts'

/**
 * Identity helper that types `sora.config.ts`.
 *
 * `colors` values are checked against the built-in palettes plus any palette
 * declared under `palettes`, so a typo fails to compile.
 */
export function defineSoraConfig<const TPalette extends string = never>(
  config: SoraConfigInput<TPalette>,
): SoraConfigInput<TPalette> {
  return config
}

function mergeDefaults(input: SoraConfigInput<string>['defaults']): SoraComponentDefaults {
  const base = defaultSoraConfig.defaults
  const merged = {} as { -readonly [K in keyof SoraComponentDefaults]: SoraComponentDefaults[K] }
  for (const key of Object.keys(base) as (keyof SoraComponentDefaults)[]) {
    Object.assign(merged, { [key]: Object.freeze({ ...base[key], ...input?.[key] }) })
  }
  return Object.freeze(merged)
}

/** Fill every omitted option and validate palette references. */
export function normalizeSoraConfig(input: SoraConfigInput<string> = {}): SoraConfig {
  const allPalettes = { ...palettes, ...input.palettes }
  const colors = { ...defaultSoraConfig.colors, ...input.colors }

  for (const role of SORA_COLOR_ROLES) {
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
    colorMode: input.colorMode ?? defaultSoraConfig.colorMode,
    density: input.density ?? defaultSoraConfig.density,
    radius: input.radius ?? defaultSoraConfig.radius,
    motion: input.motion ?? defaultSoraConfig.motion,
    fonts: Object.freeze({ ...defaultSoraConfig.fonts, ...input.fonts }),
    defaults: mergeDefaults(input.defaults),
    tokens: Object.freeze({
      both: Object.freeze({ ...input.tokens?.both }),
      light: Object.freeze({ ...input.tokens?.light }),
      dark: Object.freeze({ ...input.tokens?.dark }),
    }),
  })
}
