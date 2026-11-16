import { useField } from '@formisch/vue'
import type {
  FieldElementProps,
  FieldStore,
  FormSchema,
  FormStore,
  RequiredPath,
  UseFieldConfig,
} from '@formisch/vue'
import { ref, toValue, watch } from 'vue'
import type { MaybeRefOrGetter } from 'vue'
import type { UiControlAttrs } from '../types/common.ts'
import { steadyWhilePressed } from './press.ts'

/** Props that connect one library control to one Formisch field. */
export interface UiFormFieldBinding<TValue> {
  modelValue: TValue
  'onUpdate:modelValue': (value: unknown) => void
  /** Formisch's element props, routed to the *native* control by the component. */
  controlAttrs: UiControlAttrs
  error: readonly string[] | null
}

export interface UseUiFormFieldOptions {
  /**
   * When the field shows its validation messages.
   *
   * Formisch validates the whole form at once and assigns errors to every
   * field, so leaving the first field would otherwise mark all the fields
   * the user has not reached yet. `visited` (default) shows a field's
   * messages once that field has been left (blur) or the form has been
   * submitted; `always` shows whatever the store holds (use it with
   * `validate: 'initial'`).
   */
  reveal?: 'visited' | 'always' | undefined
  /**
   * Which messages the control shows. A Valibot pipe reports every rule that
   * failed (an empty email is both "required" and "not an email"), so the
   * default is `first`: the most basic problem, which is the one to fix
   * next. `all` passes every message through.
   */
  errors?: 'first' | 'all' | undefined
}

export interface UiFormField<TSchema extends FormSchema, TFieldPath extends RequiredPath> {
  /**
   * The underlying Formisch field store (getter-backed; do not destructure it
   * into snapshots). `field.errors` always holds the complete, ungated list.
   */
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

type Messages = readonly string[] | null

const sameMessages = (a: Messages, b: Messages): boolean =>
  a === b ||
  (a !== null && b !== null && a.length === b.length && a.every((message, index) => message === b[index]))

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
  options: UseUiFormFieldOptions = {},
): UiFormField<TSchema, TFieldPath> {
  const field = useField(form, config)
  type Input = FieldStore<TSchema, TFieldPath>['input']

  const update = (value: unknown): void => {
    field.input = (value ?? undefined) as Input
  }

  // "Visited" means the user has left the control at least once. Formisch's
  // own `isTouched` is set on focus, which is too early to show a message.
  const visited = ref(false)
  // `reset()` clears `isTouched`; a field that is untouched again starts over.
  watch(
    () => field.isTouched,
    (touched) => {
      if (!touched) visited.value = false
    },
  )

  // `field.props` with an extended `onBlur`. Property descriptors are copied
  // (not spread) so the reactive `name` getter of array items stays a getter.
  const controlAttrs = Object.defineProperties(
    {},
    {
      ...Object.getOwnPropertyDescriptors(field.props),
      onBlur: {
        enumerable: true,
        value: (): void => {
          visited.value = true
          field.props.onBlur()
        },
      },
    },
  ) as FieldElementProps

  const revealed = (): boolean => options.reveal === 'always' || visited.value || toValue(form).isSubmitted
  // A message revealed by a blur must not move the button whose press caused that blur.
  const steady = steadyWhilePressed<Messages>(sameMessages)

  return {
    field,
    // A getter, so every read inside a template is tracked by the render effect.
    get props() {
      const errors = revealed() ? field.errors : null
      return {
        modelValue: field.input,
        'onUpdate:modelValue': update,
        controlAttrs,
        error: steady(errors && options.errors !== 'all' ? errors.slice(0, 1) : errors),
      }
    },
  }
}
