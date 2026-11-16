/**
 * Spring easings for CSS.
 *
 * Native iOS interfaces animate with springs rather than cubic curves. CSS
 * can play a spring back exactly with `linear()`: the closed-form solution of
 * a damped spring, sampled into a list of points. Unlike a cubic-bezier, the
 * list may pass 1 and come back (a bounce).
 */

/** How close to rest (as a share of the distance) counts as settled. */
const REST = 0.001

/**
 * Position of a unit spring (from 0 to 1, starting at rest) at `time`, where
 * time 1 is the moment it has settled.
 *
 * @param damping damping ratio: 1 is critically damped (no overshoot); lower values bounce.
 */
export function springValue(time: number, damping: number): number {
  if (time <= 0) return 0
  if (time >= 1) return 1
  const zeta = Math.min(Math.max(damping, 0.2), 1)
  if (zeta === 1) {
    // (1 + wt) e^(-wt) = REST  =>  wt = 9.233 for REST = 0.001
    const w = 9.233 * time
    return 1 - (1 + w) * Math.exp(-w)
  }
  const root = Math.sqrt(1 - zeta * zeta)
  // The envelope e^(-zeta w t) / root reaches REST at time 1.
  const omega = Math.log(1 / (REST * root)) / zeta
  const decay = Math.exp(-zeta * omega * time)
  const phase = root * omega * time
  return 1 - decay * (Math.cos(phase) + (zeta / root) * Math.sin(phase))
}

/**
 * A CSS `linear()` easing that plays a spring with the given damping ratio.
 * Use it with a duration; the spring has settled when the duration ends.
 */
export function springEasing(damping: number, samples = 28): string {
  const points: string[] = []
  for (let index = 0; index <= samples; index++) {
    const value = index === samples ? 1 : springValue(index / samples, damping)
    points.push(String(Math.round(value * 1000) / 1000))
  }
  return `linear(${points.join(', ')})`
}
