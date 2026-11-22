<script setup lang="ts" vapor>
// 6. Formisch field state, blur validation, submit validation, async submission.
import { handleSubmit, useField, useForm } from '@formisch/vue'
import * as v from 'valibot'

const props = defineProps<{
  save: (output: { email: string }) => Promise<void>
}>()

const schema = v.object({
  email: v.pipe(v.string(), v.nonEmpty('required'), v.email('invalid')),
})

const form = useForm({ schema, initialInput: { email: '' }, validate: 'blur', revalidate: 'input' })
const email = useField(form, { path: ['email'] })
const submit = handleSubmit(form, (output) => props.save(output))

// Formisch registers the element through `ref`; a Vapor function ref hands it
// the real <input>, never a component instance.
const register = (element: unknown): void => {
  email.props.ref(element instanceof Element ? element : null)
}
</script>

<template>
  <form novalidate data-testid="form" @submit.prevent="submit()">
    <input
      :ref="register"
      data-testid="form-email"
      type="email"
      :name="email.props.name"
      :value="email.input"
      :aria-invalid="email.errors ? 'true' : undefined"
      @input="email.input = ($event.target as HTMLInputElement).value"
      @focus="email.props.onFocus()"
      @change="email.props.onChange($event)"
      @blur="email.props.onBlur()"
    />
    <p v-if="email.errors" data-testid="form-error">{{ email.errors[0] }}</p>
    <output data-testid="form-state"
      >{{ form.isSubmitting ? 'submitting' : 'idle' }}|{{ email.isTouched ? 'touched' : 'untouched' }}|{{
        email.isDirty ? 'dirty' : 'pristine'
      }}</output
    >
    <button type="submit" data-testid="form-submit" :disabled="form.isSubmitting">save</button>
  </form>
</template>
