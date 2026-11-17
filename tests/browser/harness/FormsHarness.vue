<script setup lang="ts" vapor>
import { insert, remove, useFieldArray, useForm } from '@formisch/vue'
import * as v from 'valibot'
import { useTemplateRef } from 'vue'
import {
  SoraButton,
  SoraCheckbox,
  SoraCheckboxGroup,
  SoraInput,
  SoraNumberInput,
  SoraProvider,
  SoraRadioGroup,
  SoraSelect,
} from '@your-scope/ui'
import { SoraForm, SoraFormErrorSummary, useSoraFormField } from '@your-scope/ui/forms'
import FormsTagRow from './FormsTagRow.vue'

export interface FormsState {
  locale: 'en' | 'ja'
  /** Validated outputs the submit callback received, in order. */
  outputs: unknown[]
  /** Events emitted by SoraForm, in order. */
  events: string[]
  /** When set, the submit callback stays pending until `release()` is called. */
  hold: boolean
  /** Settles the pending submit callback: resolve, or reject with the given error. */
  release: ((error?: Error) => void) | null
}

const { state } = defineProps<{ state: FormsState }>()

const messages = {
  en: {
    required: 'This field is required.',
    email: 'Enter a valid email address.',
    min: 'Enter a value of 18 or more.',
    accepted: 'You must accept this to continue.',
  },
  ja: {
    required: 'この項目は必須です。',
    email: '有効なメールアドレスを入力してください。',
    min: '18 以上の値を入力してください。',
    accepted: '続行するには同意が必要です。',
  },
}
// Messages are functions: they are produced in the locale that is active when validation runs.
const message = (key: keyof (typeof messages)['en']) => (): string => messages[state.locale][key]

const schema = v.object({
  email: v.pipe(v.string(), v.nonEmpty(message('required')), v.email(message('email'))),
  age: v.optional(v.pipe(v.number(), v.minValue(18, message('min')))),
  plan: v.picklist(['free', 'pro'], message('required')),
  contact: v.picklist(['email', 'phone'], message('required')),
  topics: v.pipe(v.array(v.string()), v.minLength(1, message('required'))),
  address: v.object({ city: v.pipe(v.string(), v.nonEmpty(message('required'))) }),
  tags: v.array(v.pipe(v.string(), v.nonEmpty(message('required')))),
  terms: v.literal(true, message('accepted')),
})

const form = useForm({
  schema,
  initialInput: { email: '', address: { city: 'Tokyo' }, tags: [], topics: [] },
  validate: 'blur',
  revalidate: 'input',
})

const email = useSoraFormField(form, { path: ['email'] })
const age = useSoraFormField(form, { path: ['age'] })
const plan = useSoraFormField(form, { path: ['plan'] })
const contact = useSoraFormField(form, { path: ['contact'] })
const topics = useSoraFormField(form, { path: ['topics'] })
const city = useSoraFormField(form, { path: ['address', 'city'] })
const terms = useSoraFormField(form, { path: ['terms'] })
const tags = useFieldArray(form, { path: ['tags'] })

const plans = [
  { value: 'free' as const, label: 'Free' },
  { value: 'pro' as const, label: 'Pro' },
]
const methods = [
  { value: 'email' as const, label: 'By email' },
  { value: 'phone' as const, label: 'By phone' },
]
const topicOptions = [
  { value: 'product', label: 'Product news' },
  { value: 'security', label: 'Security notices' },
  { value: 'events', label: 'Events' },
]

/** The awaited submit callback. Its parameter type is inferred from the schema output. */
function save(output: v.InferOutput<typeof schema>): Promise<void> {
  state.outputs.push({ ...output, tags: [...output.tags], topics: [...output.topics] })
  if (!state.hold) return Promise.resolve()
  return new Promise<void>((resolve, reject) => {
    state.release = (error) => {
      state.release = null
      if (error) reject(error)
      else resolve()
    }
  })
}

const formRef = useTemplateRef('formRef')

defineExpose({
  requestSubmit: () => formRef.value?.requestSubmit(),
  reset: () => formRef.value?.reset(),
  element: () => formRef.value?.element,
  store: () => form,
  fieldErrors: (name: 'email' | 'city') => (name === 'email' ? email.field.errors : city.field.errors),
})
</script>

<template>
  <SoraProvider :locale="state.locale">
    <SoraForm
      ref="formRef"
      :of="form"
      :submit="save"
      data-testid="form"
      @submitted="state.events.push('submitted')"
      @invalid="state.events.push('invalid')"
      @error="state.events.push(`error:${($event as Error).message}`)"
    >
      <template #default="{ isSubmitting, isValid, isDirty }">
        <SoraFormErrorSummary data-testid="summary" />
        <SoraInput
          v-bind="email.props"
          label="Email"
          type="email"
          hint="Used for sign-in"
          required
          data-testid="email"
        />
        <SoraNumberInput v-bind="age.props" label="Age" data-testid="age" />
        <SoraSelect
          v-bind="plan.props"
          label="Plan"
          placeholder="Choose a plan"
          :options="plans"
          required
          data-testid="plan"
        />
        <SoraRadioGroup
          v-bind="contact.props"
          label="Contact method"
          :options="methods"
          required
          data-testid="contact"
        />
        <SoraCheckboxGroup
          v-bind="topics.props"
          label="Topics"
          :options="topicOptions"
          required
          data-testid="topics"
        />
        <SoraInput v-bind="city.props" label="City" data-testid="city" />
        <fieldset>
          <legend>Tags</legend>
          <FormsTagRow
            v-for="(item, index) in tags.items"
            :key="item"
            :form="form"
            :index="index"
            @remove="remove(form, { path: ['tags'], at: index })"
          />
          <SoraButton data-testid="add-tag" @click="insert(form, { path: ['tags'], initialInput: '' })"
            >Add tag</SoraButton
          >
        </fieldset>
        <SoraCheckbox v-bind="terms.props" label="I accept the terms" required data-testid="terms" />
        <SoraButton type="reset" data-testid="reset">Reset</SoraButton>
        <SoraButton type="submit" :loading="isSubmitting" data-testid="submit">Save</SoraButton>
        <output data-testid="flags"
          >{{ isSubmitting ? 'submitting' : 'idle' }}|{{ isValid ? 'valid' : 'invalid' }}|{{
            isDirty ? 'dirty' : 'pristine'
          }}</output
        >
      </template>
    </SoraForm>
  </SoraProvider>

  <!-- Outside any SoraForm: the store is passed explicitly. -->
  <SoraFormErrorSummary :of="form" title="Fix these fields" :heading-level="3" data-testid="summary-outside">
    <template #entry="{ entry, focus }">
      <button type="button" data-testid="summary-entry" @click="focus">
        {{ entry.path.join('.') }}: {{ entry.message }}
      </button>
    </template>
  </SoraFormErrorSummary>
</template>
