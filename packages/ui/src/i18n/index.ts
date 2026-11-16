/**
 * @your-scope/ui/i18n: petite-vue-i18n adapter.
 *
 * Optional entry: requires the `petite-vue-i18n` peer. The core entry never
 * imports it; components only know the small `SoraTranslator` interface.
 */
export { createPetiteTranslator, createSoraI18n } from './create-sora-i18n.ts'
export { pseudoLocalize } from '../internal/pseudo.ts'
export type { SoraCompiledMessage, SoraCompiledMessages } from './compiled.ts'
export type { CreateSoraI18nOptions, SoraI18n, SoraI18nMessages, SoraPetiteI18n } from './types.ts'
