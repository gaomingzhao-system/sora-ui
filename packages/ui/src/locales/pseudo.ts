import en from './en.ts'
import type { UiMessages } from './en.ts'
import { pseudoLocalize } from '../internal/pseudo.ts'

/**
 * Pseudo-locale (`en-XA`): accented, ~40% longer English used to catch
 * truncation and hard-coded strings. Placeholders are preserved.
 */
const pseudo = Object.fromEntries(
  Object.entries(en).map(([key, message]) => [key, pseudoLocalize(message)]),
) as UiMessages

export default pseudo
