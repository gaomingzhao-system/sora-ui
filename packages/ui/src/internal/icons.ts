import type { UiIconDefinition } from '../types/common.ts'

/**
 * Built-in glyphs: original, hand-authored paths on a 24x24 grid.
 *
 * Each icon is a separate export so bundlers keep only what is imported;
 * there is no name-indexed catalogue. Paths are static, trusted data.
 */
const stroke = (...paths: string[]): UiIconDefinition => Object.freeze({ paths: Object.freeze(paths) })
const directional = (...paths: string[]): UiIconDefinition =>
  Object.freeze({ paths: Object.freeze(paths), directional: true })
const filled = (...paths: string[]): UiIconDefinition =>
  Object.freeze({ paths: Object.freeze(paths), filled: true })

const CIRCLE = 'M3 12a9 9 0 1 0 18 0a9 9 0 1 0-18 0z'

export const iconCheck = stroke('M5 12.5l4.5 4.5L19 7.5')
export const iconClose = stroke('M6 6l12 12', 'M18 6L6 18')
export const iconChevronDown = stroke('M6 9l6 6l6-6')
export const iconChevronUp = stroke('M6 15l6-6l6 6')
export const iconChevronRight = directional('M9 6l6 6l-6 6')
export const iconChevronLeft = directional('M15 6l-6 6l6 6')
export const iconMinus = stroke('M5 12h14')
export const iconPlus = stroke('M12 5v14', 'M5 12h14')
export const iconSearch = stroke('M5 11a6 6 0 1 0 12 0a6 6 0 1 0-12 0z', 'M15.5 15.5L20 20')
export const iconEye = stroke(
  'M2.5 12s3.5-6.5 9.5-6.5s9.5 6.5 9.5 6.5s-3.5 6.5-9.5 6.5S2.5 12 2.5 12z',
  'M9.25 12a2.75 2.75 0 1 0 5.5 0a2.75 2.75 0 1 0-5.5 0z',
)
export const iconEyeOff = stroke(
  'M6.2 6.6C3.8 8.3 2.5 12 2.5 12s3.5 6.5 9.5 6.5c1.7 0 3.2-.5 4.5-1.2',
  'M10 5.7c.6-.1 1.3-.2 2-.2c6 0 9.5 6.5 9.5 6.5s-.8 1.5-2.3 3.1',
  'M4 4l16 16',
)
export const iconInfo = stroke(CIRCLE, 'M12 11v5.5', 'M12 7.75v.01')
export const iconSuccess = stroke(CIRCLE, 'M8 12.5l2.75 2.75L16 9.5')
export const iconWarning = stroke('M12 3.75L21.5 20h-19L12 3.75z', 'M12 10v4.5', 'M12 17.25v.01')
export const iconError = stroke(CIRCLE, 'M12 7.5v5.5', 'M12 16.25v.01')
export const iconSortAscending = stroke('M12 19V5', 'M6.5 10.5L12 5l5.5 5.5')
export const iconSortDescending = stroke('M12 5v14', 'M6.5 13.5L12 19l5.5-5.5')
export const iconSort = stroke('M8 9.5l4-4l4 4', 'M8 14.5l4 4l4-4')
export const iconMore = filled(
  'M4 12a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0-3 0z',
  'M10.5 12a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0-3 0z',
  'M17 12a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0-3 0z',
)
export const iconUpload = stroke('M12 16V4', 'M7 9l5-5l5 5', 'M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3')
export const iconFile = stroke(
  'M7 3.5h6.5L19 9v10.5a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-15a1 1 0 0 1 1-1z',
  'M13.5 3.5V9H19',
)
export const iconExternal = stroke(
  'M14 5h5v5',
  'M19 5l-8 8',
  'M17 14v4a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h4',
)
export const iconUser = stroke(
  'M8.5 8.5a3.5 3.5 0 1 0 7 0a3.5 3.5 0 1 0-7 0z',
  'M5 19.5c1.2-3.2 3.8-5 7-5s5.8 1.8 7 5',
)
export const iconInbox = stroke(
  'M4 13.5l2.6-7.2A2 2 0 0 1 8.5 5h7a2 2 0 0 1 1.9 1.3L20 13.5',
  'M4 13.5V18a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4.5h-5a3 3 0 0 1-6 0H4z',
)
export const iconMenu = stroke('M4 7h16', 'M4 12h16', 'M4 17h16')
export const iconSun = stroke(
  'M8 12a4 4 0 1 0 8 0a4 4 0 1 0-8 0z',
  'M12 2.5v2',
  'M12 19.5v2',
  'M2.5 12h2',
  'M19.5 12h2',
  'M5.3 5.3l1.4 1.4',
  'M17.3 17.3l1.4 1.4',
  'M5.3 18.7l1.4-1.4',
  'M17.3 6.7l1.4-1.4',
)
export const iconMoon = stroke('M20 14.5A8.5 8.5 0 0 1 9.5 4a7 7 0 1 0 10.5 10.5z')
export const iconMonitor = stroke(
  'M4 5h16a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z',
  'M9 20h6',
  'M12 16v4',
)
export const iconGlobe = stroke(
  CIRCLE,
  'M3 12h18',
  'M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9s1.3-6.4 3.8-9z',
)
