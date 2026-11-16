import { palettes } from './palettes.ts'
import type { SoraComponentDefaults, SoraConfig, SoraFontConfig } from './types.ts'

export const defaultFonts: SoraFontConfig = Object.freeze({
  sans: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", "Noto Sans", "Hiragino Sans", "Noto Sans JP", "Noto Sans Arabic", sans-serif',
  serif:
    'ui-serif, "Iowan Old Style", "Palatino Linotype", Georgia, "Noto Serif", "Hiragino Mincho ProN", serif',
  mono: 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace',
  display: 'sans',
})

export const defaultComponentDefaults: SoraComponentDefaults = Object.freeze({
  button: Object.freeze({ size: 'md', variant: 'solid', color: 'primary' }),
  iconButton: Object.freeze({ size: 'md', variant: 'ghost', color: 'neutral' }),
  link: Object.freeze({ color: 'secondary' }),
  card: Object.freeze({ padding: 'md', variant: 'outline' }),
  badge: Object.freeze({ size: 'md', variant: 'soft', color: 'neutral' }),
  alert: Object.freeze({ variant: 'soft', color: 'info' }),
  avatar: Object.freeze({ size: 'md' }),
  control: Object.freeze({ size: 'md' }),
  tabs: Object.freeze({ size: 'md' }),
  table: Object.freeze({ size: 'md' }),
} satisfies SoraComponentDefaults)

/** The library's built-in design system when no `sora.config.ts` overrides it. */
export const defaultSoraConfig: SoraConfig = Object.freeze({
  colors: Object.freeze({
    primary: 'neutral',
    secondary: 'terracotta',
    success: 'green',
    info: 'blue',
    warning: 'amber',
    error: 'red',
    neutral: 'taupe',
  }),
  palettes,
  colorMode: 'inherit',
  density: 'compact',
  radius: 'md',
  motion: 'subtle',
  fonts: defaultFonts,
  defaults: defaultComponentDefaults,
  tokens: Object.freeze({ both: Object.freeze({}), light: Object.freeze({}), dark: Object.freeze({}) }),
})
