import { pseudoLocalize } from '../../../../packages/ui/src/internal/pseudo.ts'
import en from './en.ts'
import type { GalleryMessages } from './en.ts'

/** Pseudo-locale (`en-XA`) for the gallery copy; see the library's own pseudo locale. */
const pseudo = Object.fromEntries(
  Object.entries(en).map(([key, message]) => [key, pseudoLocalize(message)]),
) as GalleryMessages

export default pseudo
