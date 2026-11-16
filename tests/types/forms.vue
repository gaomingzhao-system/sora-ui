<script setup lang="ts" vapor>
/** Type tests for the Formisch integration (type-checked only, never rendered). */
import { useForm } from '@formisch/vue'
import * as v from 'valibot'
import { SoraCheckbox, SoraInput, SoraNumberInput } from '@your-scope/ui'
import { SoraForm, SoraFormErrorSummary, useSoraFormField } from '@your-scope/ui/forms'
import type { SoraFormFieldBinding } from '@your-scope/ui/forms'

const schema = v.object({
  email: v.pipe(v.string(), v.email()),
  age: v.optional(v.number()),
  terms: v.boolean(),
  address: v.object({ city: v.string() }),
})
type Output = v.InferOutput<typeof schema>

const form = useForm({ schema, initialInput: { email: '', address: { city: '' } } })

const email = useSoraFormField(form, { path: ['email'] })
const age = useSoraFormField(form, { path: ['age'] })
const terms = useSoraFormField(form, { path: ['terms'] })
const city = useSoraFormField(form, { path: ['address', 'city'] }, { reveal: 'always', errors: 'all' })

// The binding value follows the schema input at that path.
const emailValue: string | undefined = email.props.modelValue
const ageValue: number | undefined = age.props.modelValue
const cityBinding: SoraFormFieldBinding<string | undefined> = city.props
// @ts-expect-error an email field is not a number
const wrongValue: number | undefined = email.props.modelValue
// @ts-expect-error the path must exist in the schema
useSoraFormField(form, { path: ['missing'] })
// @ts-expect-error nested paths are checked as well
useSoraFormField(form, { path: ['address', 'street'] })
// @ts-expect-error unknown option value
useSoraFormField(form, { path: ['email'] }, { reveal: 'sometimes' })
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
  <SoraForm :of="form" :submit="save" autocomplete="on" @submitted="() => {}" @error="(error) => error">
    <template #default="{ isSubmitting, isValid, isDirty }">
      <SoraFormErrorSummary :heading-level="3" errors="all" reveal="always" />
      <SoraInput v-bind="email.props" label="Email" />
      <SoraNumberInput v-bind="age.props" label="Age" />
      <SoraCheckbox v-bind="terms.props" label="Terms" />
      <SoraInput v-bind="city.props" label="City" />
      {{ (isSubmitting && isValid && isDirty) satisfies boolean }}
    </template>
  </SoraForm>
  <SoraForm
    :of="form"
    :submit="saveSync"
    @invalid="(...args) => args.length satisfies 0"
    @error="(error) => (error instanceof Error ? error.message : String(error))"
  />
  <SoraFormErrorSummary :of="form" title="Fix these" />

  <!-- @vue-expect-error the callback must accept the schema output -->
  <SoraForm :of="form" :submit="saveWrong" />
  <!-- @vue-expect-error `submit` is required: SoraForm awaits it -->
  <SoraForm :of="form" />
  <!-- @vue-expect-error `of` must be a Formisch store -->
  <SoraForm :of="{}" :submit="save" />
  <!-- @vue-expect-error heading levels are 2 to 6 -->
  <SoraFormErrorSummary :heading-level="1" />
</template>
