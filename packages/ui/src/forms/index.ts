/**
 * @your-scope/ui/forms: Formisch + Valibot integration.
 *
 * Optional entry: requires the `@formisch/vue` and `valibot` peers. Nothing
 * in the core entry imports this module or those packages.
 *
 * Only Formisch's composables and methods are used. Its own `Form`/`Field`
 * components are ordinary VDOM SFCs and are deliberately not rendered here.
 */
export { default as UiForm } from './UiForm.vue'
export type { UiFormProps } from './UiForm.vue'
export { default as UiFormErrorSummary } from './UiFormErrorSummary.vue'
export type { UiFormErrorSummaryProps } from './UiFormErrorSummary.vue'
export { useUiFormField } from './use-ui-form-field.ts'
export type { UiFormField, UiFormFieldBinding, UseUiFormFieldOptions } from './use-ui-form-field.ts'
export type { UiFormContext, UiFormErrorEntry } from './types.ts'
