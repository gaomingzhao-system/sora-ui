# @your-scope/ui

A compact component library written entirely for **Vue Vapor mode**: 44 components with a traditional
API (props, `v-model`, slots), native platform behaviour (`<dialog>`, the Popover API, CSS anchor
positioning, native form controls) and a warm, quiet visual language.

```bash
pnpm add @your-scope/ui vue@3.6.0-rc.15
```

```ts
import { createVaporApp } from 'vue'
import '@your-scope/ui/styles.css'
import App from './App.vue'

createVaporApp(App).mount('#app')
```

```vue
<script setup lang="ts" vapor>
import { ref } from 'vue'
import { UiButton, UiInput } from '@your-scope/ui'

const name = ref('')
</script>

<template>
  <UiInput v-model="name" label="Name" required />
  <UiButton type="submit">Save</UiButton>
</template>
```

## Entry points

| Import                                 | Contents                                                  | Extra peer dependencies    |
| -------------------------------------- | --------------------------------------------------------- | -------------------------- |
| `@your-scope/ui`                       | components, composables, icons, types                     |                            |
| `@your-scope/ui/components/<Name>`     | one component (default export)                            |                            |
| `@your-scope/ui/forms`                 | `UiForm`, `UiFormErrorSummary`, `useUiFormField`          | `@formisch/vue`, `valibot` |
| `@your-scope/ui/i18n`                  | petite-vue-i18n adapter                                   | `petite-vue-i18n`          |
| `@your-scope/ui/i18n/locales/<locale>` | precompiled messages: `en`, `ja`, `ar`, `pseudo`          |                            |
| `@your-scope/ui/locales/<locale>`      | the same messages as plain strings                        |                            |
| `@your-scope/ui/theme`                 | runtime theming helpers                                   |                            |
| `@your-scope/ui/styles.css`            | compiled stylesheet (no Tailwind needed, no global reset) |                            |
| `@your-scope/ui/tailwind.css`          | Tailwind CSS v4 integration: token mapping and variants   |                            |

## Requirements

- Vue **exactly `3.6.0-rc.15`**, in an application created with `createVaporApp`, built by a bundler
  that compiles Vapor SFCs (Vite with `@vitejs/plugin-vue` 6).
- A browser with CSS anchor positioning, the Popover API, `<dialog>` and `light-dark()`.
- No server-side rendering support is claimed.

Documentation (components, theming, forms, i18n, accessibility, compatibility) is in the repository's
`docs` folder.

## License

MIT
