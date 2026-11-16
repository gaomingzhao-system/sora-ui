<script setup lang="ts" vapor>
import { useTemplateRef } from 'vue'
import {
  UiCheckbox,
  UiCheckboxGroup,
  UiDateInput,
  UiField,
  UiFileInput,
  UiInput,
  UiNumberInput,
  UiPasswordInput,
  UiRadioGroup,
  UiSelect,
  UiSlider,
  UiSwitch,
  UiTextarea,
} from '@your-scope/ui'
import type { UiControlAttrs, UiOption, UiOptionGroup } from '@your-scope/ui'

export interface InputsState {
  text: string | null | undefined
  error: string | readonly string[] | null
  hint: string | undefined
  disabled: boolean
  describedBy: string | undefined
  controlAttrs: UiControlAttrs | undefined
  events: string[]
  showInput: boolean
  textarea: string
  password: string
  revealed: boolean
  amount: number | null | undefined
  date: string | null
  checked: boolean | null
  mixed: boolean
  selected: string[]
  plan: number | null
  on: boolean
  country: number | null
  volume: number
  files: File[]
  previews: boolean
  showFiles: boolean
  resets: number
}

const { state } = defineProps<{ state: InputsState }>()

const input = useTemplateRef('input')
const number = useTemplateRef('number')
const radios = useTemplateRef('radios')
const files = useTemplateRef('files')

const languages: UiOption[] = [
  { value: 'ts', label: 'TypeScript' },
  { value: 'rs', label: 'Rust', description: 'Systems programming' },
  { value: 'go', label: 'Go', disabled: true },
]
const plans: UiOption<number>[] = [
  { value: 1, label: 'Free', description: 'For individuals' },
  { value: 2, label: 'Team' },
  { value: 3, label: 'Enterprise', disabled: true },
]
const countries: (UiOption<number> | UiOptionGroup<number>)[] = [
  { value: 81, label: 'Japan' },
  { value: 33, label: 'France' },
  {
    label: 'Americas',
    options: [
      { value: 1, label: 'United States' },
      { value: 55, label: 'Brazil', disabled: true },
    ],
  },
]

defineExpose({
  input: () => input.value,
  number: () => number.value,
  radios: () => radios.value,
  files: () => files.value,
})
</script>

<template>
  <UiField data-testid="field" label="Custom" hint="Field hint" :error="state.error" required>
    <template #default="{ id, describedBy, invalid }">
      <input
        :id="id"
        data-testid="field-control"
        :aria-describedby="describedBy"
        :aria-invalid="invalid ? 'true' : undefined"
      />
    </template>
  </UiField>
  <UiField data-testid="fieldset" as="fieldset" label="Group" hint="Group hint" disabled>
    <input data-testid="fieldset-control" />
  </UiField>

  <UiInput
    v-if="state.showInput"
    ref="input"
    v-model="state.text"
    data-testid="input"
    class="from-caller"
    style="margin-block: 3px"
    label="Full name"
    name="fullname"
    autocomplete="name"
    inputmode="text"
    enterkeyhint="next"
    form="some-form"
    placeholder="Ada"
    :hint="state.hint"
    :error="state.error"
    :disabled="state.disabled"
    :aria-describedby="state.describedBy"
    :control-attrs="state.controlAttrs"
    required
    @blur="state.events.push('attr:blur')"
    @keydown="state.events.push(`key:${$event.key}`)"
  >
    <template #leading><span data-testid="leading">@</span></template>
  </UiInput>

  <UiTextarea
    v-model="state.textarea"
    data-testid="textarea"
    label="Bio"
    autosize
    :rows="2"
    :max-rows="4"
    name="bio"
  />
  <UiPasswordInput
    v-model="state.password"
    v-model:revealed="state.revealed"
    data-testid="password"
    label="Password"
    autocomplete="new-password"
  />

  <UiNumberInput
    ref="number"
    v-model="state.amount"
    data-testid="number"
    label="Seats"
    :min="0"
    :max="10"
    :step="0.5"
    controls
    name="seats"
  />
  <UiDateInput v-model="state.date" data-testid="date" label="Start" min="2026-01-01" name="start" />

  <UiCheckbox
    v-model="state.checked"
    v-model:indeterminate="state.mixed"
    data-testid="checkbox"
    label="Select all"
    hint="Applies to every row"
    name="all"
    value="yes"
  />
  <UiCheckbox
    :model-value="false"
    data-testid="checkbox-invalid"
    label="Terms"
    error="You must accept."
    required
  />
  <UiCheckboxGroup
    v-model="state.selected"
    data-testid="checkbox-group"
    :options="languages"
    label="Languages"
    hint="Pick some"
    name="lang"
  />
  <UiRadioGroup
    ref="radios"
    v-model="state.plan"
    data-testid="radio-group"
    :options="plans"
    label="Plan"
    required
  />
  <UiSwitch v-model="state.on" data-testid="switch" label="Notifications" hint="Weekly" name="notify" />

  <UiSelect
    v-model="state.country"
    data-testid="select"
    :options="countries"
    label="Country"
    placeholder="Choose"
    name="country"
  />
  <UiSlider
    v-model="state.volume"
    data-testid="slider"
    label="Volume"
    :min="0"
    :max="50"
    :step="5"
    show-value
    :format-value="(value) => `${value} dB`"
  />

  <form data-testid="file-form" @reset="state.resets++">
    <UiFileInput
      v-if="state.showFiles"
      ref="files"
      v-model="state.files"
      data-testid="files"
      label="Attachments"
      multiple
      :previews="state.previews"
      accept="image/*,.txt"
      name="attachments"
    />
    <button type="reset" data-testid="file-reset">reset</button>
  </form>
</template>
