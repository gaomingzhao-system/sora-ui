<script setup lang="ts" vapor>
/** Type tests for the Formisch integration (type-checked only, never rendered). */
import { useForm } from '@formisch/vue'
import * as v from 'valibot'
import { UiCheckbox, UiInput, UiNumberInput } from '@your-scope/ui'
import { UiForm, UiFormErrorSummary, useUiFormField } from '@your-scope/ui/forms'
import type { UiFormFieldBinding } from '@your-scope/ui/forms'

const schema = v.object({
  email: v.pipe(v.string(), v.email()),
  age: v.optional(v.number()),
  terms: v.boolean(),
  address: v.object({ city: v.string() }),
})
type Output = v.InferOutput<typeof schema>

const form = useForm({ schema, initialInput: { email: '', address: { city: '' } } })

const email = useUiFormField(form, { path: ['email'] })
const age = useUiFormField(form, { path: ['age'] })
const terms = useUiFormField(form, { path: ['terms'] })
const city = useUiFormField(form, { path: ['address', 'city'] }, { reveal: 'always', errors: 'all' })

// The binding value follows the schema input at that path.
const emailValue: string | undefined = email.props.modelValue
const ageValue: number | undefined = age.props.modelValue
const cityBinding: UiFormFieldBinding<string | undefined> = city.props
// @ts-expect-error an email field is not a number
const wrongValue: number | undefined = email.props.modelValue
// @ts-expect-error the path must exist in the schema
useUiFormField(form, { path: ['missing'] })
// @ts-expect-error nested paths are checked as well
useUiFormField(form, { path: ['address', 'street'] })
// @ts-expect-error unknown option value
useUiFormField(form, { path: ['email'] }, { reveal: 'sometimes' })
void [emailValue, ageValue, cityBinding, wrongValue]

// The submit callback receives the validated output of the schema and may be async.
async function save(output: Output): Promise<void> {
  const typed: { email: string; age?: number | undefined; terms: boolean; address: { city: string } } = output
  await Promise.resolve(typed)
}
function saveSync(output: Output): void {
  void output.address.city.toUpperCase()
}
function saveWrong(output: { email: number }): void {
  void output
}
</script>

<template>
  <UiForm :of="form" :submit="save" autocomplete="on" @submitted="() => {}" @error="(error) => error">
    <template #default="{ isSubmitting, isValid, isDirty }">
      <UiFormErrorSummary :heading-level="3" errors="all" reveal="always" />
      <UiInput v-bind="email.props" label="Email" />
      <UiNumberInput v-bind="age.props" label="Age" />
      <UiCheckbox v-bind="terms.props" label="Terms" />
      <UiInput v-bind="city.props" label="City" />
      {{ (isSubmitting && isValid && isDirty) satisfies boolean }}
    </template>
  </UiForm>
  <UiForm
    :of="form"
    :submit="saveSync"
    @invalid="(...args) => args.length satisfies 0"
    @error="(error) => (error instanceof Error ? error.message : String(error))"
  />
  <UiFormErrorSummary :of="form" title="Fix these" />

  <!-- @vue-expect-error the callback must accept the schema output -->
  <UiForm :of="form" :submit="saveWrong" />
  <!-- @vue-expect-error `submit` is required: UiForm awaits it -->
  <UiForm :of="form" />
  <!-- @vue-expect-error `of` must be a Formisch store -->
  <UiForm :of="{}" :submit="save" />
  <!-- @vue-expect-error heading levels are 2 to 6 -->
  <UiFormErrorSummary :heading-level="1" />
</template>
