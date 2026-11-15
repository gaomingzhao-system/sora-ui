import { useField } from '@formisch/vue'
import type { FieldStore, FormSchema, FormStore, RequiredPath, UseFieldConfig } from '@formisch/vue'
import type { MaybeRefOrGetter } from 'vue'
import type { UiControlAttrs } from '../types/common.ts'

/** Props that connect one library control to one Formisch field. */
export interface UiFormFieldBinding<TValue> {
  modelValue: TValue
  'onUpdate:modelValue': (value: unknown) => void
  /** Formisch's element props, routed to the *native* control by the component. */
  controlAttrs: UiControlAttrs
  error: readonly string[] | null
}

export interface UiFormField<TSchema extends FormSchema, TFieldPath extends RequiredPath> {
  /** The underlying Formisch field store (getter-backed; do not destructure it into snapshots). */
  readonly field: FieldStore<TSchema, TFieldPath>
  /**
   * Bind with `v-bind="x.props"` on any library control:
   *
   *   <UiInput v-bind="email.props" label="Email" />
   *
   * It supplies the value, the update handler, the native-control binding
   * (`controlAttrs`, including Formisch's element `ref`) and the errors.
   */
  readonly props: UiFormFieldBinding<FieldStore<TSchema, TFieldPath>['input']>
}

/**
 * `useField()` plus the wiring every control needs.
 *
 * Controls emit `null` for "no value" (an empty number, date, select or
 * combobox); Formisch models a missing value as `undefined`, so `null` is
 * translated on the way in. The field's `props` are passed through
 * `controlAttrs` and never spread on the component, so Formisch always
 * registers the real `<input>` rather than a component instance.
 */
export function useUiFormField<TSchema extends FormSchema, TFieldPath extends RequiredPath>(
  form: MaybeRefOrGetter<FormStore<TSchema>>,
  config: MaybeRefOrGetter<UseFieldConfig<TSchema, TFieldPath>>,
): UiFormField<TSchema, TFieldPath> {
  const field = useField(form, config)
  type Input = FieldStore<TSchema, TFieldPath>['input']

  const update = (value: unknown): void => {
    field.input = (value ?? undefined) as Input
  }

  return {
    field,
    // A getter, so every read inside a template is tracked by the render effect.
    get props() {
      return {
        modelValue: field.input,
        'onUpdate:modelValue': update,
        controlAttrs: field.props,
        error: field.errors,
      }
    },
  }
}
