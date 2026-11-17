import { describe, expect, it } from 'vitest'
import {
  contrastRatio,
  formatHex,
  formatOklch,
  oklchToSrgb,
  relativeLuminance,
  toGamut,
} from '@your-scope/theme'

describe('colour math', () => {
  it('converts the OKLCH extremes to sRGB', () => {
    expect(formatHex(oklchToSrgb([1, 0, 0]))).toBe('#ffffff')
    expect(formatHex(oklchToSrgb([0, 0, 0]))).toBe('#000000')
    // sRGB red is approximately oklch(62.8% 0.2577 29.23).
    expect(formatHex(oklchToSrgb([0.62796, 0.25768, 29.2339]))).toBe('#ff0000')
  })

  it('computes WCAG luminance and contrast', () => {
    expect(relativeLuminance([1, 1, 1])).toBeCloseTo(1, 5)
    expect(relativeLuminance([0, 0, 0])).toBe(0)
    expect(contrastRatio([1, 1, 1], [0, 0, 0])).toBeCloseTo(21, 5)
    // Order does not matter, and identical colours have no contrast.
    expect(contrastRatio([0, 0, 0], [1, 1, 1])).toBeCloseTo(21, 5)
    expect(contrastRatio([0.5, 0.5, 0.5], [0.5, 0.5, 0.5])).toBe(1)
    // #767676 on white is the classic 4.54:1 boundary case.
    const grey = 0x76 / 255
    expect(contrastRatio([grey, grey, grey], [1, 1, 1])).toBeCloseTo(4.54, 2)
  })

  it('maps out-of-gamut colours into sRGB by reducing chroma only', () => {
    const [l, c, h] = toGamut([0.7, 0.4, 150])
    expect(l).toBe(0.7)
    expect(h).toBe(150)
    expect(c).toBeLessThan(0.4)
    expect(c).toBeGreaterThan(0.1)
    for (const channel of oklchToSrgb([0.7, 0.4, 150])) {
      expect(channel).toBeGreaterThanOrEqual(0)
      expect(channel).toBeLessThanOrEqual(1)
    }
    // An in-gamut colour is returned untouched.
    expect(toGamut([0.5, 0.05, 80])).toEqual([0.5, 0.05, 80])
  })

  it('serialises compact CSS', () => {
    expect(formatOklch([0.5, 0.1, 40])).toBe('oklch(50% 0.1 40)')
    expect(formatOklch([0.5, 0.1, 40], 0.42)).toBe('oklch(50% 0.1 40 / 42%)')
    // Hue is meaningless without chroma; it is normalised to 0.
    expect(formatOklch([1, 0, 123])).toBe('oklch(100% 0 0)')
  })
})
