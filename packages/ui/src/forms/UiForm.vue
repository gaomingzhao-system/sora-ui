<script setup lang="ts" vapor generic="TSchema extends FormSchema">
import { getDeepErrorEntries, handleSubmit, reset as resetStore, setErrors, validate } from '@formisch/vue'
import type { FormSchema, FormStore, SubmitEventHandler } from '@formisch/vue'
import { computed, provide, useTemplateRef, watch } from 'vue'
import type { FormHTMLAttributes } from 'vue'
import { useUiLocale } from '../composables/use-ui-locale.ts'
import { uiFormKey } from './types.ts'

export interface UiFormProps<TFormSchema extends FormSchema = FormSchema>
  extends /* @vue-ignore */ Omit<FormHTMLAttributes, 'onSubmit' | 'novalidate'> {
  /** The Formisch store returned by `useForm()`. */
  of: FormStore<TFormSchema>
  /**
   * Called with the validated output when the form is submitted and valid.
   * It is **awaited**: the form stays in its submitting state (and further
   * submissions are ignored) until the returned promise settles. A rejection
   * becomes a form-level error.
   */
  submit: SubmitEventHandler<TFormSchema>
}

defineOptions({ name: 'UiForm' })

const { of, submit } = defineProps<UiFormProps<TSchema>>()

const emit = defineEmits<{
  /** The `submit` callback resolved. Notification only: it is not awaited. */
  submitted: []
  /** Validation failed on submit. */
  invalid: []
  /** The `submit` callback rejected. */
  error: [error: unknown]
}>()

defineSlots<{
  default?(props: { isSubmitting: boolean; isValid: boolean; isDirty: boolean }): unknown
}>()

const { locale } = useUiLocale()
const element = useTemplateRef<HTMLFormElement>('element')

// Formisch store generics are invariant in places; the context only needs the base shape.
provide(uiFormKey, {
  form: () => of as unknown as FormStore<FormSchema>,
  element: () => element.value,
})

const handler: SubmitEventHandler<TSchema> = async (output, event) => {
  try {
    await submit(output, event)
  } catch (error) {
    emit('error', error)
    throw error
  }
  emit('submitted')
}
const run = computed(() => handleSubmit(of, handler))

let inFlight = false

/**
 * The single submission path: the submit button, Enter in a field and
 * `requestSubmit()` all arrive here, so the duplicate guard lives here too
 * (a disabled or loading button alone would not cover the other two).
 */
async function onSubmit(event: SubmitEvent): Promise<void> {
  event.preventDefault()
  if (inFlight || of.isSubmitting) return
  inFlight = true
  try {
    await run.value(event)
    if (getDeepErrorEntries(of).length > 0) emit('invalid')
  } finally {
    inFlight = false
  }
}

// A native reset would only restore DOM defaults and desynchronise the store.
function onReset(event: Event): void {
  event.preventDefault()
  resetStore(of)
}

type AnyPath = readonly (string | number)[]
const pathKey = (path: AnyPath): string => JSON.stringify(path)

/**
 * Locale change: regenerate the *visible* validation messages in the new
 * language. Values, touched and dirty state are untouched, and fields that
 * showed no error before are not given one now.
 */
watch(locale, async () => {
  const before = getDeepErrorEntries(of)
  if (before.length === 0) return
  const shown = new Set(before.map((entry) => pathKey(entry.path as AnyPath)))
  const formLevel = of.errors

  await validate(of, { shouldFocus: false })

  for (const entry of getDeepErrorEntries(of)) {
    const path = entry.path as AnyPath
    if (shown.has(pathKey(path))) continue
    if (path.length === 0) setErrors(of, { errors: null })
    else setErrors(of, { path, errors: null } as never)
  }
  // Form-level errors that came from the submit callback are not schema errors; keep them.
  if (formLevel && !of.errors) setErrors(of, { errors: formLevel })
})

defineExpose({
  /**
   * Submit through the native form (fires `submit`, runs validation and the
   * duplicate guard). Never `form.submit()`, which would bypass all of that.
   */
  requestSubmit: () => element.value?.requestSubmit(),
  /** Reset the Formisch store to its initial input. */
  reset: () => resetStore(of),
  /** The native form element. */
  get element() {
    return element.value
  },
})
</script>

<template>
  <form
    ref="element"
    class="vui-form"
    novalidate
    :aria-busy="of.isSubmitting ? 'true' : undefined"
    @submit="onSubmit"
    @reset="onReset"
  >
    <slot :is-submitting="of.isSubmitting" :is-valid="of.isValid" :is-dirty="of.isDirty" />
  </form>
</template>
