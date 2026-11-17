import type { InjectionKey } from 'vue'
import type { FormSchema, FormStore } from '@formisch/vue'

/** What SoraForm shares with SoraFormErrorSummary (typed provide/inject). */
export interface SoraFormContext {
  /** The Formisch store of the surrounding SoraForm. */
  readonly form: () => FormStore<FormSchema>
  /** The native `<form>` element once mounted. */
  readonly element: () => HTMLFormElement | null
}

export const soraFormKey: InjectionKey<SoraFormContext> = Symbol('sora.form')

/** One line of the error summary. */
export interface SoraFormErrorEntry {
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
