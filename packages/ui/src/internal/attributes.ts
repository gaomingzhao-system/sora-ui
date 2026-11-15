type Attrs = Readonly<Record<string, unknown>>

/** Join id references (for `aria-describedby`/`aria-labelledby`) without losing any. */
export function mergeIds(...ids: readonly unknown[]): string | undefined {
  const seen = new Set<string>()
  for (const value of ids) {
    if (typeof value !== 'string') continue
    for (const id of value.split(/\s+/)) if (id) seen.add(id)
  }
  return seen.size > 0 ? [...seen].join(' ') : undefined
}

/** `class`/`style` customise the root; every other attribute belongs to the native control. */
export function splitAttrs(attrs: Attrs): { root: Attrs; control: Attrs } {
  const { class: className, style, ...control } = attrs
  return { root: { class: className, style }, control }
}

/** Remove keys that the component binds itself, so a caller cannot clobber them. */
export function omitKeys<T extends Attrs, K extends string>(attrs: T, keys: readonly K[]): Omit<T, K> {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(attrs)) {
    if (!(keys as readonly string[]).includes(key)) result[key] = value
  }
  return result as Omit<T, K>
}

/** Call several handlers for one event, in order (caller's handlers are never overwritten). */
export function composeHandlers<E>(
  ...handlers: readonly (((event: E) => void) | undefined | null)[]
): (event: E) => void {
  return (event) => {
    for (const handler of handlers) handler?.(event)
  }
}

/** `true`/`false` as the string ARIA expects, or `undefined` to omit the attribute. */
export function ariaBool(value: boolean | undefined, omitWhenFalse = true): 'true' | 'false' | undefined {
  if (value) return 'true'
  return omitWhenFalse ? undefined : 'false'
}
