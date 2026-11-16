/**
 * Console discipline for the browser tests.
 *
 * Every `console.warn` and `console.error` during a test fails that test
 * (tests/browser/setup.ts): a Vue warning such as "Extraneous non-props
 * attributes" is a defect in a component even when all assertions pass.
 * A test that provokes a message on purpose announces it with
 * `allowConsole()`.
 */
const recorded: string[] = []
const allowed: RegExp[] = []

const format = (parts: readonly unknown[]): string =>
  parts
    .map((part) => (part instanceof Error ? part.message : typeof part === 'string' ? part : String(part)))
    .join(' ')

for (const level of ['warn', 'error'] as const) {
  const original = console[level].bind(console)
  console[level] = (...parts: unknown[]): void => {
    recorded.push(`console.${level}: ${format(parts)}`)
    original(...parts)
  }
}

/** Declare that the current test expects console output matching `pattern`. */
export function allowConsole(pattern: RegExp): void {
  allowed.push(pattern)
}

/** Messages of the test that just ran which nobody announced; resets the state for the next test. */
export function takeUnexpectedConsole(): string[] {
  const unexpected = recorded.filter((message) => !allowed.some((pattern) => pattern.test(message)))
  recorded.length = 0
  allowed.length = 0
  return unexpected
}
