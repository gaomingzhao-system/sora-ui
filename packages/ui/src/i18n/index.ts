/**
 * @your-scope/ui/i18n: petite-vue-i18n adapter.
 *
 * Optional entry: requires the `petite-vue-i18n` peer. The core entry never
 * imports it; components only know the small `UiTranslator` interface.
 */
export { createPetiteTranslator, createUiI18n } from './create-ui-i18n.ts'
export { pseudoLocalize } from '../internal/pseudo.ts'
export type { UiCompiledMessage, UiCompiledMessages } from './compiled.ts'
export type { CreateUiI18nOptions, UiI18n, UiI18nMessages, UiPetiteI18n } from './types.ts'
