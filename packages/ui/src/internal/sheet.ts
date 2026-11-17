/**
 * Sheet physics: snap points, rubber banding, release projection, velocity
 * tracking and the spring a sheet settles with. Pure functions, no DOM.
 *
 * Positions are *offsets*: how far (px) the sheet is moved towards the edge
 * it comes from. `0` is fully open and the sheet's size is closed, whatever
 * the side. Velocities are px/ms, positive towards closed.
 */

/**
 * A resting position, expressed as how much of the sheet is visible:
 *
 * - a number from `0` to `1` is a fraction of the sheet's full size (`0.5` is half open)
 * - a number above `1`, or a `px` string, is a size in pixels (`240` or `'240px'`)
 * - a `%` string is a percentage of the full size (`'50%'`)
 */
export type SoraSnapPoint = number | `${number}px` | `${number}%`

/** Snap points closer than this (px) to a position count as reached. */
const EPSILON = 0.5
/** Release velocity (px/ms) from which a release counts as a flick. */
const FLICK_VELOCITY = 0.4
/**
 * How far (px) a release keeps travelling per px/ms of velocity before a snap
 * point is picked: UIScrollView's fast deceleration rate, `0.99 / (1 - 0.99)`.
 */
const MOMENTUM = 99
/** UIScrollView's rubber band constant: how much an overdrag follows the finger at first. */
const RUBBER_BAND = 0.55

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/** Visible size (px) of `point` for a sheet whose full size is `size`. */
export function resolveSnapPoint(point: SoraSnapPoint, size: number): number {
  let visible: number
  if (typeof point === 'number') visible = point <= 1 ? point * size : point
  else if (point.endsWith('%')) visible = (Number.parseFloat(point) / 100) * size
  else visible = Number.parseFloat(point)
  return Number.isFinite(visible) ? clamp(visible, 0, size) : size
}

/** Offset of every snap point for a sheet of `size`. */
export function snapOffsets(points: readonly SoraSnapPoint[], size: number): number[] {
  return points.map((point) => size - resolveSnapPoint(point, size))
}

/** Index of `point` in `points`, or `-1`. Numbers compare loosely, so `1 / 3` matches `0.333`. */
export function findSnapIndex(
  points: readonly SoraSnapPoint[],
  point: SoraSnapPoint | null | undefined,
): number {
  if (point == null) return -1
  return points.findIndex(
    (candidate) =>
      candidate === point ||
      (typeof candidate === 'number' && typeof point === 'number' && Math.abs(candidate - point) < 1e-3),
  )
}

/**
 * Rubber banding as UIScrollView does it: an overdrag of `distance` px moves
 * the sheet less and less the further it goes, and never more than `limit` px.
 */
export function rubberBand(distance: number, limit: number): number {
  if (distance <= 0 || limit <= 0) return 0
  return (1 - 1 / ((distance * RUBBER_BAND) / limit + 1)) * limit
}

export interface SheetRelease {
  /** Snap point offsets (see `snapOffsets`). */
  offsets: readonly number[]
  /** Offset at which the sheet is fully hidden. */
  closed: number
  /** Offset at release. */
  position: number
  /** Release velocity. */
  velocity: number
  dismissible: boolean
  /** Share of the way from the smallest snap point to closed that closes the sheet. */
  closeThreshold: number
}

export type SheetReleaseTarget = { type: 'snap'; index: number } | { type: 'close' }

/**
 * Where a sheet goes once it is released. The release is projected forward by
 * its momentum and the nearest snap point wins, while a flick always moves on
 * to the next snap point in its direction, as iOS sheets do.
 */
export function releaseTarget(release: SheetRelease): SheetReleaseTarget {
  const { offsets, closed, position, velocity, dismissible } = release
  const projected = position + velocity * MOMENTUM
  const lowest = Math.max(...offsets)
  const flick = Math.abs(velocity) > FLICK_VELOCITY

  if (dismissible) {
    if (flick && velocity > 0 && position >= lowest - EPSILON) return { type: 'close' }
    if (projected >= lowest + clamp(release.closeThreshold, 0, 1) * (closed - lowest))
      return { type: 'close' }
  }

  let index = nearest(offsets, projected)
  if (flick) {
    const target = offsets[index] ?? 0
    // A flick never settles behind the point it was released at.
    const behind = velocity > 0 ? target <= position + EPSILON : target >= position - EPSILON
    const next = behind ? nextSnap(offsets, position, velocity > 0 ? 1 : -1) : -1
    if (next !== -1) index = next
  }
  return { type: 'snap', index }
}

function nearest(offsets: readonly number[], position: number): number {
  let best = 0
  for (const [index, offset] of offsets.entries()) {
    if (Math.abs(offset - position) < Math.abs((offsets[best] ?? 0) - position)) best = index
  }
  return best
}

/** Closest snap point past `position`: towards closed when `direction` is 1, else towards open. */
function nextSnap(offsets: readonly number[], position: number, direction: 1 | -1): number {
  let best = -1
  for (const [index, offset] of offsets.entries()) {
    const ahead = direction > 0 ? offset > position + EPSILON : offset < position - EPSILON
    if (ahead && (best === -1 || Math.abs(offset - position) < Math.abs((offsets[best] ?? 0) - position))) {
      best = index
    }
  }
  return best
}

// ------------------------------------------------------------------ velocity
/** Samples older than this (ms) do not count towards the velocity. */
const WINDOW = 100
/** A pointer resting longer than this (ms) before release has no velocity. */
const STALE = 50

export interface VelocityTracker {
  reset(): void
  /** Record `position` (px) at `time` (ms). */
  add(time: number, position: number): void
  /** Velocity (px/ms) over the last samples, as of `time`. */
  velocity(time: number): number
}

/** Estimates how fast a pointer moves from its most recent positions. */
export function createVelocityTracker(): VelocityTracker {
  // A small ring of samples: nothing is allocated while the pointer moves.
  const times = new Float64Array(16)
  const positions = new Float64Array(16)
  let start = 0
  let count = 0
  const at = (index: number): number => (start + index) % times.length

  return {
    reset() {
      start = 0
      count = 0
    },
    add(time, position) {
      // A sample that did not move (such as the release itself) says nothing
      // about the speed: a resting pointer is noticed from the time since the
      // last movement instead.
      if (count > 0 && positions[at(count - 1)] === position) return
      if (count === times.length) {
        start = at(1)
        count--
      }
      times[at(count)] = time
      positions[at(count)] = position
      count++
      while (count > 2 && time - (times[at(0)] ?? 0) > WINDOW) {
        start = at(1)
        count--
      }
    },
    velocity(time) {
      if (count < 2) return 0
      const first = at(0)
      const last = at(count - 1)
      if (time - (times[last] ?? 0) > STALE) return 0
      const elapsed = (times[last] ?? 0) - (times[first] ?? 0)
      return elapsed > 0 ? ((positions[last] ?? 0) - (positions[first] ?? 0)) / elapsed : 0
    },
  }
}

// -------------------------------------------------------------------- spring
export interface SheetSpring {
  /** Time (ms) after which the sheet has settled. */
  readonly duration: number
  /** Offset at `time` ms. */
  position(time: number): number
  /** Velocity (px/ms) at `time` ms. */
  velocity(time: number): number
}

/**
 * A critically damped spring from `from` to `to`, starting at `velocity`.
 *
 * Critically damped means it settles as fast as possible without oscillating;
 * a release with momentum still carries past the target once and comes back,
 * which is the soft landing of a native sheet. Because the motion has a
 * closed form, position and velocity are known at any time without reading
 * styles back from the page, so a sheet that is caught mid-flight and thrown
 * again keeps its momentum.
 *
 * @param settle how long (ms) a sheet at rest takes to cover the distance
 */
export function createSheetSpring(from: number, to: number, velocity: number, settle: number): SheetSpring {
  // (1 + wt) e^(-wt) falls to 0.5% at wt = 7.43.
  const omega = 7.43 / Math.max(settle, 1)
  const a = from - to
  const b = velocity + omega * a

  const position = (time: number): number => to + (a + b * time) * Math.exp(-omega * time)
  const speed = (time: number): number => (b - omega * (a + b * time)) * Math.exp(-omega * time)

  // Settled: within half a pixel and practically still. The envelope decays
  // monotonically after its peak, so stepping forward finds the end.
  let duration = settle
  const limit = settle * 3
  while (duration < limit && (Math.abs(position(duration) - to) > 0.5 || Math.abs(speed(duration)) > 0.02)) {
    duration += 16
  }

  return {
    duration,
    position: (time) => (time >= duration ? to : position(Math.max(time, 0))),
    velocity: (time) => (time >= duration ? 0 : speed(Math.max(time, 0))),
  }
}
