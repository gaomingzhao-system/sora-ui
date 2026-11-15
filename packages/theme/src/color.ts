import type { Oklch, UiColorValue } from './types.ts'

/** Gamma-encoded sRGB, channels 0..1. */
export type Rgb = readonly [red: number, green: number, blue: number]

const DEG = Math.PI / 180

/** OKLCH -> linear-light sRGB (may be out of gamut). */
export function oklchToLinearSrgb([l, c, h]: Oklch): Rgb {
  const a = c * Math.cos(h * DEG)
  const b = c * Math.sin(h * DEG)

  const l_ = l + 0.3963377774 * a + 0.2158037573 * b
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b
  const s_ = l - 0.0894841775 * a - 1.291485548 * b

  const lc = l_ ** 3
  const mc = m_ ** 3
  const sc = s_ ** 3

  return [
    4.0767416621 * lc - 3.3077115913 * mc + 0.2309699292 * sc,
    -1.2684380046 * lc + 2.6097574011 * mc - 0.3413193965 * sc,
    -0.0041960863 * lc - 0.7034186147 * mc + 1.707614701 * sc,
  ]
}

function isInGamut(rgb: Rgb, epsilon = 1e-4): boolean {
  return rgb.every((channel) => channel >= -epsilon && channel <= 1 + epsilon)
}

/**
 * Reduce chroma (holding lightness and hue) until the colour fits sRGB.
 * This mirrors how browsers gamut-map `oklch()`, so the values we emit are
 * the values we measure.
 */
export function toGamut(color: Oklch): Oklch {
  if (isInGamut(oklchToLinearSrgb(color))) return color
  const [l, , h] = color
  let low = 0
  let high = color[1]
  for (let i = 0; i < 24; i++) {
    const mid = (low + high) / 2
    if (isInGamut(oklchToLinearSrgb([l, mid, h]))) low = mid
    else high = mid
  }
  return [l, low, h]
}

function encode(channel: number): number {
  const clamped = Math.min(1, Math.max(0, channel))
  return clamped <= 0.0031308 ? 12.92 * clamped : 1.055 * clamped ** (1 / 2.4) - 0.055
}

function decode(channel: number): number {
  return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
}

/** OKLCH -> gamma-encoded sRGB, gamut-mapped. */
export function oklchToSrgb(color: Oklch): Rgb {
  const [r, g, b] = oklchToLinearSrgb(toGamut(color))
  return [encode(r), encode(g), encode(b)]
}

/** Source-over compositing in gamma-encoded sRGB, as browsers do. */
export function compositeOver(foreground: Rgb, alpha: number, background: Rgb): Rgb {
  return [
    foreground[0] * alpha + background[0] * (1 - alpha),
    foreground[1] * alpha + background[1] * (1 - alpha),
    foreground[2] * alpha + background[2] * (1 - alpha),
  ]
}

/** WCAG 2.x relative luminance. */
export function relativeLuminance([r, g, b]: Rgb): number {
  return 0.2126 * decode(r) + 0.7152 * decode(g) + 0.0722 * decode(b)
}

/** WCAG 2.x contrast ratio between two opaque sRGB colours (1..21). */
export function contrastRatio(a: Rgb, b: Rgb): number {
  const la = relativeLuminance(a)
  const lb = relativeLuminance(b)
  const [lighter, darker] = la >= lb ? [la, lb] : [lb, la]
  return (lighter + 0.05) / (darker + 0.05)
}

/** Resolve a (possibly translucent) colour to opaque sRGB over a background. */
export function flatten(color: UiColorValue, background: Rgb): Rgb {
  const rgb = oklchToSrgb(color.oklch)
  return color.alpha >= 1 ? rgb : compositeOver(rgb, color.alpha, background)
}

function round(value: number, digits: number): number {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

/** Serialise as a CSS `oklch()` colour (gamut-mapped, compact). */
export function formatOklch(color: Oklch, alpha = 1): string {
  const [l, c, h] = toGamut(color)
  const body = `${round(l * 100, 2)}% ${round(c, 4)} ${round(c < 1e-4 ? 0 : h, 2)}`
  return alpha >= 1 ? `oklch(${body})` : `oklch(${body} / ${round(alpha * 100, 1)}%)`
}

/** `#rrggbb` for documentation and tooling. */
export function formatHex(rgb: Rgb): string {
  const hex = rgb.map((channel) =>
    Math.round(Math.min(1, Math.max(0, channel)) * 255)
      .toString(16)
      .padStart(2, '0'),
  )
  return `#${hex.join('')}`
}
