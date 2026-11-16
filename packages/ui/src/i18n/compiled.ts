import type { UiMessageKey } from '../locales/en.ts'

/**
 * A message precompiled at build time (opaque message AST). The published
 * `@your-scope/ui/i18n/locales/*` modules contain these, so they also work
 * when the application drops the runtime message compiler.
 *
 * This module has no imports besides the key type: a locale chunk's
 * declarations must not pull in petite-vue-i18n or Vue.
 */
export type UiCompiledMessage = unknown

/** The library's messages for one locale, precompiled. */
export type UiCompiledMessages = Readonly<Record<UiMessageKey, UiCompiledMessage>>
