<script setup lang="ts" vapor generic="T extends string | number">
import type { HTMLAttributes } from 'vue'
import { useControl } from '../../composables/use-control.ts'
import type { SoraControlAttrs, SoraOption, SoraOrientation, SoraSize } from '../../types/common.ts'
import SoraCheckbox from './SoraCheckbox.vue'
import SoraField from './SoraField.vue'

export interface SoraCheckboxGroupProps<TValue extends string | number = string>
  extends /* @vue-ignore */ HTMLAttributes {
  /** Selected values. `null`/`undefined` are treated as none; updates keep option order. */
  modelValue: readonly TValue[] | null | undefined
  options: readonly SoraOption<TValue>[]
  /** Group label, rendered as the `<legend>`. */
  label?: string | undefined
  hint?: string | undefined
  error?: string | readonly string[] | null | undefined
  /** Shows the required marker. "At least one" must be enforced by validation. */
  required?: boolean | undefined
  disabled?: boolean | undefined
  invalid?: boolean | undefined
  size?: SoraSize | undefined
  orientation?: SoraOrientation | undefined
  /** Native `name` shared by the checkboxes (form submission). */
  name?: string | undefined
  /** Applied to every native checkbox; `ref` is called once per checkbox. */
  controlAttrs?: SoraControlAttrs | undefined
}

defineOptions({ name: 'SoraCheckboxGroup', inheritAttrs: false })

const {
  modelValue,
  options,
  label,
  hint,
  error,
  required = false,
  disabled = false,
  invalid = false,
  size,
  orientation = 'vertical',
  name,
  controlAttrs,
} = defineProps<SoraCheckboxGroupProps<T>>()

const emit = defineEmits<{
  'update:modelValue': [value: T[]]
}>()

defineSlots<{ label?(): unknown; hint?(): unknown }>()

const control = useControl(() => undefined)

function toggle(value: T, checked: boolean): void {
  const selected = new Set(modelValue ?? [])
  if (checked) selected.add(value)
  else selected.delete(value)
  emit(
    'update:modelValue',
    options.map((option) => option.value).filter((candidate) => selected.has(candidate)),
  )
}
</script>

<template>
  <SoraField
    v-bind="{ ...control.rootAttrs.value, ...control.nativeAttrs.value }"
    as="fieldset"
    :label="label"
    :hint="hint"
    :error="error"
    :required="required"
    :disabled="disabled"
    :invalid="invalid"
    :size="size"
  >
    <template #default="field">
      <div class="sora-option-list" :data-orientation="orientation">
        <SoraCheckbox
          v-for="option in options"
          :key="option.value"
          :model-value="(modelValue ?? []).includes(option.value)"
          :label="option.label"
          :hint="option.description"
          :disabled="disabled || option.disabled"
          :invalid="field.invalid"
          :size="size"
          :name="controlAttrs?.name ?? name"
          :value="String(option.value)"
          :control-attrs="controlAttrs"
          @update:model-value="toggle(option.value, $event)"
        />
      </div>
    </template>
    <template v-if="$slots.label" #label><slot name="label" /></template>
    <template v-if="$slots.hint" #hint><slot name="hint" /></template>
  </SoraField>
</template>
