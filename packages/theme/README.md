# @your-scope/theme

The design-system configuration behind `@your-scope/ui`: OKLCH palettes, a typed `defineUiConfig()`,
the resolver that turns a configuration into `--vui-*` custom properties, and a contrast audit. It has
no dependencies and runs in Node and in the browser.

```ts
import { createPalette, createThemeVars, defineUiConfig, resolveTheme, themeToCss } from '@your-scope/theme'

const config = defineUiConfig({
  palettes: { brand: createPalette({ hue: 250, chroma: 0.12 }) },
  colors: { primary: 'brand' },
  radius: 'lg',
})

// A complete token stylesheet (what `pnpm generate:theme` writes for the library)...
const css = themeToCss(resolveTheme(config))

// ...or only the custom properties a partial configuration changes, for a nested provider.
const vars = createThemeVars({ colors: { primary: 'violet' } })
```

Applications normally reach these helpers through `@your-scope/ui/theme`. See the repository's
`docs/theming.md`.

## License

MIT
