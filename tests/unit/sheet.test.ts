import { describe, expect, it } from 'vitest'
import {
  createSheetSpring,
  createVelocityTracker,
  findSnapIndex,
  releaseTarget,
  resolveSnapPoint,
  rubberBand,
  snapOffsets,
} from '../../packages/ui/src/internal/sheet.ts'
import { springEasing, springValue } from '../../packages/theme/src/motion.ts'

describe('snap points', () => {
  it('resolves fractions, percentages and pixels to visible sizes', () => {
    expect(resolveSnapPoint(0.5, 800)).toBe(400)
    expect(resolveSnapPoint(1, 800)).toBe(800)
    expect(resolveSnapPoint('25%', 800)).toBe(200)
    expect(resolveSnapPoint('240px', 800)).toBe(240)
    expect(resolveSnapPoint(240, 800)).toBe(240)
    // Never more than the sheet, never less than nothing.
    expect(resolveSnapPoint(2000, 800)).toBe(800)
    expect(resolveSnapPoint('-10px', 800)).toBe(0)
  })

  it('turns snap points into offsets from fully open', () => {
    expect(snapOffsets([1 / 4, 1 / 2, 1], 800)).toEqual([600, 400, 0])
  })

  it('finds snap points loosely, so 1 / 3 matches a rounded third', () => {
    expect(findSnapIndex([1 / 3, 1 / 2, 1], 0.3333)).toBe(0)
    expect(findSnapIndex(['200px', 1], '200px')).toBe(0)
    expect(findSnapIndex([0.5, 1], 0.75)).toBe(-1)
    expect(findSnapIndex([0.5, 1], undefined)).toBe(-1)
  })
})

describe('rubber banding', () => {
  it('follows less and less, and never past its limit', () => {
    const limit = 64
    const small = rubberBand(10, limit)
    const large = rubberBand(1000, limit)
    expect(small).toBeGreaterThan(0)
    expect(small).toBeLessThan(10)
    expect(large).toBeLessThan(limit)
    expect(rubberBand(200, limit) - rubberBand(100, limit)).toBeLessThan(rubberBand(100, limit))
    expect(rubberBand(0, limit)).toBe(0)
    expect(rubberBand(-5, limit)).toBe(0)
  })
})

describe('release', () => {
  const offsets = [600, 400, 0]
  const base = { offsets, closed: 800, dismissible: true, closeThreshold: 0.25 }

  it('settles on the nearest snap point after a slow release', () => {
    expect(releaseTarget({ ...base, position: 480, velocity: 0 })).toEqual({ type: 'snap', index: 1 })
    expect(releaseTarget({ ...base, position: 560, velocity: 0 })).toEqual({ type: 'snap', index: 0 })
  })

  it('moves on to the next snap point on a flick, and skips several on a hard one', () => {
    // From the middle snap point, a quick flick up lands on the top one.
    expect(releaseTarget({ ...base, position: 400, velocity: -0.6 })).toEqual({ type: 'snap', index: 2 })
    // A flick never settles behind the point it was released at: just past
    // the middle snap point, a flick down goes on to the bottom one...
    expect(releaseTarget({ ...base, position: 410, velocity: 0.5 })).toEqual({ type: 'snap', index: 0 })
    // ...while just before it, the middle one is the next stop.
    expect(releaseTarget({ ...base, position: 390, velocity: 0.5 })).toEqual({ type: 'snap', index: 1 })
    // A hard flick from the bottom snap point projects past the middle one.
    expect(releaseTarget({ ...base, position: 600, velocity: -8 })).toEqual({ type: 'snap', index: 2 })
  })

  it('closes past the threshold or on a flick down from the smallest snap point', () => {
    expect(releaseTarget({ ...base, position: 660, velocity: 0 })).toEqual({ type: 'close' })
    expect(releaseTarget({ ...base, position: 620, velocity: 0 })).toEqual({ type: 'snap', index: 0 })
    expect(releaseTarget({ ...base, position: 600, velocity: 0.5 })).toEqual({ type: 'close' })
  })

  it('never closes a sheet that is not dismissible', () => {
    expect(releaseTarget({ ...base, dismissible: false, position: 790, velocity: 3 })).toEqual({
      type: 'snap',
      index: 0,
    })
  })
})

describe('velocity tracking', () => {
  it('measures the recent speed in px/ms', () => {
    const tracker = createVelocityTracker()
    for (let time = 0; time <= 80; time += 8) tracker.add(time, time * 2)
    expect(tracker.velocity(80)).toBeCloseTo(2, 5)
  })

  it('forgets samples older than its window and reports a resting pointer as still', () => {
    const tracker = createVelocityTracker()
    tracker.add(0, 0)
    tracker.add(500, 10)
    tracker.add(600, 210)
    tracker.add(610, 230)
    expect(tracker.velocity(610)).toBeCloseTo(2, 1)
    // Released 60ms after the last movement: the finger had stopped.
    expect(tracker.velocity(670)).toBe(0)
  })

  it('keeps working past its buffer size without allocating', () => {
    const tracker = createVelocityTracker()
    for (let index = 0; index < 100; index++) tracker.add(index * 4, index * 4)
    expect(tracker.velocity(396)).toBeCloseTo(1, 5)
    tracker.reset()
    expect(tracker.velocity(396)).toBe(0)
  })
})

describe('sheet spring', () => {
  it('starts at the release velocity and settles at the target', () => {
    const spring = createSheetSpring(400, 0, -1.5, 420)
    expect(spring.position(0)).toBeCloseTo(400, 5)
    expect(spring.velocity(0)).toBeCloseTo(-1.5, 5)
    expect(spring.position(spring.duration)).toBe(0)
    expect(spring.velocity(spring.duration)).toBe(0)
    expect(Math.abs(spring.position(spring.duration - 16))).toBeLessThan(1.5)
  })

  it('takes about the settle time from rest, and lands softly after a hard throw', () => {
    const calm = createSheetSpring(400, 0, 0, 420)
    expect(calm.duration).toBeGreaterThanOrEqual(420)
    expect(calm.duration).toBeLessThan(700)
    // Monotonic from rest: critically damped, no bounce.
    let previous = Number.POSITIVE_INFINITY
    for (let time = 0; time <= calm.duration; time += 10) {
      const position = calm.position(time)
      expect(position).toBeLessThanOrEqual(previous + 1e-9)
      previous = position
    }
    // A hard throw overshoots a little, then comes back.
    const thrown = createSheetSpring(300, 0, -10, 420)
    let lowest = 0
    for (let time = 0; time <= thrown.duration; time += 5) lowest = Math.min(lowest, thrown.position(time))
    expect(lowest).toBeLessThan(0)
    expect(lowest).toBeGreaterThan(-60)
  })
})

describe('spring easing', () => {
  it('is a CSS linear() curve from 0 to 1', () => {
    const easing = springEasing(1)
    expect(easing).toMatch(/^linear\(0, .*, 1\)$/)
    const values = easing.slice(7, -1).split(', ').map(Number)
    expect(values.length).toBeGreaterThan(20)
    // Critically damped: never past the end.
    expect(Math.max(...values)).toBeLessThanOrEqual(1)
  })

  it('overshoots a little when it bounces', () => {
    expect(springValue(0, 0.7)).toBe(0)
    expect(springValue(1, 0.7)).toBe(1)
    const values = springEasing(0.72).slice(7, -1).split(', ').map(Number)
    expect(Math.max(...values)).toBeGreaterThan(1)
    expect(Math.max(...values)).toBeLessThan(1.1)
  })
})
