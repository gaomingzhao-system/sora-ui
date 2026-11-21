<script setup lang="ts" vapor>
import { computed } from 'vue'
import type { InputHTMLAttributes } from 'vue'
import { useControl } from '../../composables/use-control.ts'
import type { SoraControlAttrs, SoraSize } from '../../types/common.ts'
import SoraField from './SoraField.vue'

export interface SoraInputProps
  extends /* @vue-ignore */ Omit<
    InputHTMLAttributes,
    'size' | 'type' | 'value' | 'disabled' | 'required' | 'id'
  > {
  /** The text. `null`/`undefined` are shown as empty; updates are always strings. */
  modelValue: string | null | undefined
  label?: string | undefined
  hint?: string | undefined
  error?: string | readonly string[] | null | undefined
  required?: boolean | undefined
  disabled?: boolean | undefined
  invalid?: boolean | undefined
  size?: SoraSize | undefined
  id?: string | undefined
  hideLabel?: boolean | undefined
  /** `horizontal` puts the label beside the control when the container is wide enough. */
  orientation?: 'vertical' | 'horizontal' | undefined
  /** Text-like native types. Use SoraNumberInput, SoraDateInput or SoraPasswordInput for the others. */
  type?: 'text' | 'email' | 'url' | 'tel' | 'search' | 'password' | undefined
  /**
   * Extra attributes, listeners and a `ref` callback for the native `<input>`,
   * e.g. a form library's field binding. Merged with fallthrough attributes.
   */
  controlAttrs?: SoraControlAttrs | undefined
}

defineOptions({ name: 'SoraInput', inheritAttrs: false })

const {
  modelValue,
  label,
  hint,
  error,
  required = false,
  disabled = false,
  invalid = false,
  size,
  id,
  hideLabel = false,
  orientation = 'vertical',
  type = 'text',
  controlAttrs,
} = defineProps<SoraInputProps>()

const emit = defineEmits<{
  /** The text changed. Always a string. */
  'update:modelValue': [value: string]
}>()

const model = computed({
  get: () => modelValue ?? '',
  set: (value: string) => emit('update:modelValue', value),
})

defineSlots<{
  /** Inside the field, before the text (icon, prefix). */
  leading?(): unknown
  /** Inside the field, after the text (icon, unit, button). */
  trailing?(): unknown
  label?(): unknown
  hint?(): unknown
}>()

const control = useControl<HTMLInputElement>(() => controlAttrs)

defineExpose({
  focus: (options?: FocusOptions) => control.element.value?.focus(options),
  select: () => control.element.value?.select(),
  /** The native input element. */
  get element() {
    return control.element.value
  },
})
</script>

<template>
  <SoraField
    v-bind="control.rootAttrs.value"
    :id="id"
    :label="label"
    :hint="hint"
    :error="error"
    :required="required"
    :disabled="disabled"
    :invalid="invalid"
    :size="size"
    :hide-label="hideLabel"
    :orientation="orientation"
  >
    <template #default="field">
      <div
        class="sora-input"
        :data-invalid="field.invalid ? '' : undefined"
        :data-disabled="disabled ? '' : undefined"
      >
        <span v-if="$slots.leading" class="sora-input__affix"><slot name="leading" /></span>
        <input
          v-bind="control.nativeAttrs.value"
          :id="field.id"
          :ref="control.setElement"
          v-model="model"
          class="sora-input__control"
          :type="type"
          :disabled="disabled"
          :required="required"
          :aria-invalid="field.invalid ? 'true' : undefined"
          :aria-describedby="control.describedBy(field.describedBy)"
        />
        <span v-if="$slots.trailing" class="sora-input__affix"><slot name="trailing" /></span>
      </div>
    </template>
    <template v-if="$slots.label" #label><slot name="label" /></template>
    <template v-if="$slots.hint" #hint><slot name="hint" /></template>
  </SoraField>
</template>
