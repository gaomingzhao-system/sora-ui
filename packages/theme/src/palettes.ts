import { toGamut } from './color.ts'
import {
  SORA_SHADES,
  type Oklch,
  type SoraBuiltinPalette,
  type SoraPaletteScale,
  type SoraShade,
} from './types.ts'

/**
 * Tonal scales are original project values (not measurements of any
 * product). Each scale is complete: eleven OKLCH steps from 50 to 950.
 *
 * Lightness ladders are shared so that the same shade number has comparable
 * contrast behaviour in every palette; the resolver still measures every
 * pair it uses instead of trusting the ladder.
 */

/** Lightness per shade for low-chroma (surface/text) palettes. */
const NEUTRAL_LIGHTNESS: Readonly<Record<SoraShade, number>> = {
  50: 0.982,
  100: 0.962,
  200: 0.922,
  300: 0.868,
  400: 0.72,
  500: 0.6,
  600: 0.5,
  700: 0.4,
  800: 0.31,
  900: 0.255,
  950: 0.205,
}

/** Lightness per shade for chromatic (intent) palettes. */
const CHROMATIC_LIGHTNESS: Readonly<Record<SoraShade, number>> = {
  50: 0.975,
  100: 0.945,
  200: 0.895,
  300: 0.825,
  400: 0.735,
  500: 0.645,
  600: 0.555,
  700: 0.47,
  800: 0.4,
  900: 0.335,
  950: 0.255,
}

/** Share of the peak chroma used at each shade (pale ends, saturated middle). */
const CHROMA_CURVE: Readonly<Record<SoraShade, number>> = {
  50: 0.14,
  100: 0.28,
  200: 0.5,
  300: 0.74,
  400: 0.94,
  500: 1,
  600: 0.96,
  700: 0.86,
  800: 0.72,
  900: 0.58,
  950: 0.42,
}

interface ScaleRecipe {
  /** Hue in degrees. */
  hue: number
  /** Peak chroma (reached at shade 500). */
  chroma: number
  /** Hue drift from the lightest to the darkest step, in degrees. */
  hueShift?: number
  kind: 'neutral' | 'chromatic'
}

const buildScale = ({ hue, chroma, hueShift = 0, kind }: ScaleRecipe): SoraPaletteScale => {
  const lightness = kind === 'neutral' ? NEUTRAL_LIGHTNESS : CHROMATIC_LIGHTNESS
  const entries = SORA_SHADES.map((shade, index): [SoraShade, Oklch] => {
    const progress = index / (SORA_SHADES.length - 1)
    // Neutral scales keep a flat, faint tint; chromatic ones follow the curve.
    const stepChroma =
      kind === 'neutral' ? chroma * (0.6 + 0.4 * Math.sin(progress * Math.PI)) : chroma * CHROMA_CURVE[shade]
    const color = toGamut([lightness[shade], stepChroma, hue + hueShift * (progress - 0.5)])
    return [shade, [round(color[0]), round(color[1]), round(color[2])]]
  })
  return Object.freeze(Object.fromEntries(entries)) as SoraPaletteScale
}

const round = (value: number): number => Math.round(value * 10000) / 10000

export const palettes: Readonly<Record<SoraBuiltinPalette, SoraPaletteScale>> = Object.freeze({
  /** Near-achromatic grey with a trace of warmth. */
  neutral: buildScale({ hue: 85, chroma: 0.004, kind: 'neutral' }),
  /** Warm paper/charcoal neutral used for canvas, surfaces and text. */
  taupe: buildScale({ hue: 85, chroma: 0.011, hueShift: -20, kind: 'neutral' }),
  /** Muted clay accent. */
  terracotta: buildScale({ hue: 40, chroma: 0.128, hueShift: -6, kind: 'chromatic' }),
  green: buildScale({ hue: 152, chroma: 0.135, hueShift: 6, kind: 'chromatic' }),
  blue: buildScale({ hue: 252, chroma: 0.145, hueShift: 8, kind: 'chromatic' }),
  amber: buildScale({ hue: 72, chroma: 0.15, hueShift: -18, kind: 'chromatic' }),
  red: buildScale({ hue: 25, chroma: 0.185, hueShift: -4, kind: 'chromatic' }),
  violet: buildScale({ hue: 295, chroma: 0.15, hueShift: 6, kind: 'chromatic' }),
  teal: buildScale({ hue: 192, chroma: 0.105, hueShift: 8, kind: 'chromatic' }),
})

export const builtinPaletteNames = Object.freeze(Object.keys(palettes)) as readonly SoraBuiltinPalette[]

/** Build a complete custom scale from a hue and peak chroma. */
export const createPalette = (recipe: {
  hue: number
  chroma: number
  hueShift?: number
  kind?: 'neutral' | 'chromatic'
}): SoraPaletteScale => buildScale({ kind: 'chromatic', ...recipe })

/** True when a scale carries so little chroma that it reads as grey. */
export const isNeutralScale = (scale: SoraPaletteScale): boolean =>
  SORA_SHADES.every((shade) => scale[shade][1] < 0.03)
