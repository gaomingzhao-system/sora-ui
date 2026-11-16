<script setup lang="ts" vapor>
/**
 * A validated profile form: Formisch + Valibot drive the state, the library
 * renders native controls. It covers required, optional, nested, conditional,
 * array, checkbox, select, numeric, date and file fields, asynchronous
 * validation, a server error, reset and duplicate-submit protection.
 */
import { insert, remove, useFieldArray, useForm } from '@formisch/vue'
import * as v from 'valibot'
import { computed, ref } from 'vue'
import {
  UiButton,
  UiCard,
  UiCheckbox,
  UiCheckboxGroup,
  UiDateInput,
  UiFileInput,
  UiIcon,
  UiInput,
  UiNumberInput,
  UiRadioGroup,
  UiSelect,
  UiTextarea,
  iconPlus,
  useToast,
} from '@your-scope/ui'
import { UiForm, UiFormErrorSummary, useUiFormField } from '@your-scope/ui/forms'
import { useT } from '../i18n.ts'
import ProfileLinkRow from './ProfileLinkRow.vue'

/** Heading level of the card title: 2 on a page of its own, 3 inside a section. */
const { headingLevel = 3 } = defineProps<{ headingLevel?: 2 | 3 | undefined }>()

const t = useT()
const toast = useToast()

const TAKEN = new Set(['admin', 'root', 'ada'])

// Messages are functions, so they are produced in the locale that is active
// when validation runs (and re-run by UiForm when the locale changes).
const required = () => t('validation.required')

const schema = v.pipeAsync(
  v.objectAsync({
    name: v.pipe(v.string(), v.trim(), v.nonEmpty(required)),
    email: v.pipe(
      v.string(),
      v.nonEmpty(required),
      v.email(() => t('validation.email')),
    ),
    username: v.pipeAsync(
      v.string(),
      v.nonEmpty(required),
      v.minLength(3, () => t('validation.minLength', { min: 3 })),
      // Asynchronous rule: pretend to ask the server whether the name is free.
      v.checkAsync(
        (value) =>
          new Promise<boolean>((resolve) => setTimeout(() => resolve(!TAKEN.has(value.toLowerCase())), 250)),
        () => t('profile.username.taken'),
      ),
    ),
    role: v.picklist(['design', 'engineering', 'research'], required),
    experience: v.optional(
      v.pipe(
        v.number(() => t('validation.number')),
        v.minValue(0, () => t('validation.min', { min: 0 })),
        v.maxValue(60, () => t('validation.max', { max: 60 })),
      ),
    ),
    start: v.optional(
      v.pipe(
        v.string(),
        v.isoDate(() => t('validation.date')),
      ),
    ),
    bio: v.optional(
      v.pipe(
        v.string(),
        v.maxLength(160, () => t('validation.maxLength', { max: 160 })),
      ),
    ),
    contact: v.object({
      method: v.picklist(['email', 'phone'], required),
      phone: v.optional(v.string()),
    }),
    topics: v.pipe(v.array(v.string()), v.minLength(1, required)),
    links: v.array(
      v.pipe(
        v.string(),
        v.nonEmpty(required),
        v.url(() => t('validation.url')),
      ),
    ),
    avatar: v.optional(v.array(v.file())),
    terms: v.literal(true, () => t('validation.accepted')),
  }),
  // Conditional rule across fields: a phone number is required only when phone is the chosen method.
  v.forwardAsync(
    v.partialCheck(
      [
        ['contact', 'method'],
        ['contact', 'phone'],
      ],
      (input) => input.contact.method !== 'phone' || Boolean(input.contact.phone?.trim()),
      required,
    ),
    ['contact', 'phone'],
  ),
)

const form = useForm({
  schema,
  initialInput: {
    name: '',
    email: '',
    username: '',
    contact: { method: 'email' },
    topics: ['product'],
    links: [],
    avatar: [],
  },
  // Errors appear after a field is left (or on submit), then update as the user types.
  validate: 'blur',
  revalidate: 'input',
})

const name = useUiFormField(form, { path: ['name'] })
const email = useUiFormField(form, { path: ['email'] })
const username = useUiFormField(form, { path: ['username'] })
const role = useUiFormField(form, { path: ['role'] })
const experience = useUiFormField(form, { path: ['experience'] })
const start = useUiFormField(form, { path: ['start'] })
const bio = useUiFormField(form, { path: ['bio'] })
const method = useUiFormField(form, { path: ['contact', 'method'] })
const phone = useUiFormField(form, { path: ['contact', 'phone'] })
const topics = useUiFormField(form, { path: ['topics'] })
const avatar = useUiFormField(form, { path: ['avatar'] })
const terms = useUiFormField(form, { path: ['terms'] })
const links = useFieldArray(form, { path: ['links'] })

const roles = computed(() => [
  { value: 'design' as const, label: t('profile.role.design') },
  { value: 'engineering' as const, label: t('profile.role.engineering') },
  { value: 'research' as const, label: t('profile.role.research') },
])
const methods = computed(() => [
  { value: 'email' as const, label: t('profile.contact.email') },
  { value: 'phone' as const, label: t('profile.contact.phone') },
])
const topicOptions = computed(() => [
  { value: 'product', label: t('profile.topics.product') },
  { value: 'security', label: t('profile.topics.security') },
  { value: 'events', label: t('profile.topics.events') },
])

const failNext = ref(false)
const submitted = ref('')

/** The awaited submit callback: the form stays busy until this settles. */
async function save(output: v.InferOutput<typeof schema>): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 700))
  if (failNext.value) throw new Error(t('profile.failed'))
  submitted.value = JSON.stringify({ ...output, avatar: output.avatar?.map((file) => file.name) }, null, 2)
  toast.add({ title: t('profile.saved'), color: 'success' })
}
</script>

<template>
  <UiCard
    as="section"
    :heading-level="headingLevel"
    :title="t('profile.title')"
    :description="t('profile.description')"
    data-testid="profile-form"
  >
    <UiForm :of="form" :submit="save" class="grid gap-4" autocomplete="on">
      <template #default="{ isSubmitting }">
        <UiFormErrorSummary />

        <div class="grid gap-3 @container sm:grid-cols-2">
          <UiInput v-bind="name.props" :label="t('profile.name')" autocomplete="name" required />
          <UiInput
            v-bind="email.props"
            type="email"
            :label="t('profile.email')"
            :hint="t('profile.email.hint')"
            autocomplete="email"
            inputmode="email"
            required
          />
          <UiInput
            v-bind="username.props"
            :label="t('profile.username')"
            autocomplete="username"
            autocapitalize="none"
            spellcheck="false"
            required
          />
          <UiSelect
            v-bind="role.props"
            :options="roles"
            :label="t('profile.role')"
            :placeholder="t('profile.role.placeholder')"
            required
          />
          <UiNumberInput
            v-bind="experience.props"
            :label="t('profile.experience')"
            :min="0"
            :max="60"
            controls
          />
          <UiDateInput v-bind="start.props" :label="t('profile.start')" />
        </div>

        <UiTextarea
          v-bind="bio.props"
          :label="t('profile.bio')"
          :hint="t('profile.bio.hint')"
          autosize
          :rows="2"
          :max-rows="6"
        />

        <div class="grid gap-3 sm:grid-cols-2">
          <UiRadioGroup
            v-bind="method.props"
            :options="methods"
            :label="t('profile.contact')"
            orientation="horizontal"
            required
          />
          <!-- Conditional field: mounted only while "phone" is selected. -->
          <UiInput
            v-if="method.field.input === 'phone'"
            v-bind="phone.props"
            type="tel"
            :label="t('profile.phone')"
            autocomplete="tel"
            inputmode="tel"
            required
          />
        </div>

        <UiCheckboxGroup
          v-bind="topics.props"
          :options="topicOptions"
          :label="t('profile.topics')"
          orientation="horizontal"
          required
        />

        <!-- Array field: one row per Formisch item id, so rows keep their state when others are removed. -->
        <fieldset class="grid gap-2">
          <legend class="mb-1.5 text-vui-sm font-medium">{{ t('profile.links') }}</legend>
          <ProfileLinkRow
            v-for="(item, index) in links.items"
            :key="item"
            :form="form"
            :index="index"
            @remove="remove(form, { path: ['links'], at: index })"
          />
          <UiButton
            class="justify-self-start"
            size="sm"
            variant="outline"
            color="neutral"
            data-testid="add-link"
            @click="insert(form, { path: ['links'], initialInput: '' })"
          >
            <template #leading><UiIcon :icon="iconPlus" /></template>
            {{ t('profile.link.add') }}
          </UiButton>
        </fieldset>

        <UiFileInput v-bind="avatar.props" :label="t('profile.avatar')" accept="image/*" previews />

        <UiCheckbox v-bind="terms.props" :label="t('profile.terms')" required />
        <UiCheckbox v-model="failNext" :label="t('profile.simulateError')" data-testid="simulate-error" />

        <div class="flex flex-wrap items-center justify-end gap-2 border-t border-vui-border pt-3">
          <UiButton type="reset" variant="ghost" color="neutral">{{ t('profile.reset') }}</UiButton>
          <UiButton type="submit" :loading="isSubmitting" data-testid="profile-submit">{{
            t('profile.submit')
          }}</UiButton>
        </div>
      </template>
    </UiForm>

    <template v-if="submitted" #footer>
      <figure class="w-full">
        <figcaption class="mb-1 text-vui-sm font-medium">{{ t('profile.output') }}</figcaption>
        <pre
          class="max-h-56 overflow-auto rounded-vui bg-vui-subtle p-2 font-vui-mono text-vui-xs"
          dir="ltr"
          data-testid="profile-output"
          tabindex="0"
          >{{ submitted }}</pre>
      </figure>
    </template>
  </UiCard>
</template>
