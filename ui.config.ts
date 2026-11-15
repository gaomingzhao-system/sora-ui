import { defineUiConfig } from '@your-scope/theme'

/**
 * The single editable source of the default design system.
 *
 * `pnpm generate:theme` turns this file into
 *   - packages/ui/src/styles/theme.generated.css  (tokens for the stylesheet)
 *   - packages/ui/src/config.generated.ts         (runtime component defaults)
 * so changing a value here changes the shipped design system without touching
 * a component.
 *
 * Every `colors` value names a *palette*. `primary: 'neutral'` selects the
 * neutral palette; it is unrelated to the `neutral` role below.
 */
export default defineUiConfig({
  colors: {
    primary: 'neutral',
    secondary: 'terracotta',
    success: 'green',
    info: 'blue',
    warning: 'amber',
    error: 'red',
    neutral: 'taupe',
  },
  density: 'compact',
  radius: 'md',
  motion: 'subtle',
  defaults: {
    button: { size: 'md', variant: 'solid', color: 'primary' },
    card: { padding: 'md', variant: 'outline' },
  },
})
