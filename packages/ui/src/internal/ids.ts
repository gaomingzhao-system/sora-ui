import { useId } from 'vue'

/**
 * Stable per-instance id prefix. `useId()` is deterministic for a component
 * position, so ids never change between updates (no `Math.random()`).
 */
export const useSoraId = (explicit?: string): string => {
  const generated = useId()
  return explicit ?? `sora-${generated}`
}

/** CSS `<dashed-ident>` derived from an id, for `anchor-name`. */
export const anchorName = (id: string): string => `--${id.replace(/[^\w-]/g, '-')}`
