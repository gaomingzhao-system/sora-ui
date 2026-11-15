import type { InjectionKey } from 'vue'
import type { FormSchema, FormStore } from '@formisch/vue'

/** What UiForm shares with UiFormErrorSummary (typed provide/inject). */
export interface UiFormContext {
  /** The Formisch store of the surrounding UiForm. */
  readonly form: () => FormStore<FormSchema>
  /** The native `<form>` element once mounted. */
  readonly element: () => HTMLFormElement | null
}

export const uiFormKey: InjectionKey<UiFormContext> = Symbol('vui.form')

/** One line of the error summary. */
export interface UiFormErrorEntry {
  /** Stable key for rendering. */
  readonly key: string
  /** Field path, empty for form-level errors. */
  readonly path: readonly (string | number)[]
  /** Label of the field (from its `<label>` or `<legend>`), when the control was found. */
  readonly label: string | undefined
  /** Id of the control to link to and focus, when the control was found. */
  readonly fieldId: string | undefined
  readonly message: string
}
