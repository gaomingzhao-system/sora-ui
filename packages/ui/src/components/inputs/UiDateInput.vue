<script setup lang="ts" vapor>
import type { InputHTMLAttributes } from 'vue'
import { useControl } from '../../composables/use-control.ts'
import type { UiControlAttrs, UiSize } from '../../types/common.ts'
import UiField from './UiField.vue'

export interface UiDateInputProps
  extends /* @vue-ignore */ Omit<
    InputHTMLAttributes,
    'size' | 'type' | 'value' | 'disabled' | 'required' | 'id' | 'min' | 'max'
  > {
  /**
   * A calendar date as `YYYY-MM-DD`, or `null` when empty. A plain string on
   * purpose: no `Date` object means no accidental time-zone shift.
   */
  modelValue: string | null | undefined
  label?: string | undefined
  hint?: string | undefined
  error?: string | readonly string[] | null | undefined
  required?: boolean | undefined
  disabled?: boolean | undefined
  invalid?: boolean | undefined
  size?: UiSize | undefined
  id?: string | undefined
  hideLabel?: boolean | undefined
  /** `horizontal` puts the label beside the control when the container is wide enough. */
  orientation?: 'vertical' | 'horizontal' | undefined
  /** Earliest selectable date, `YYYY-MM-DD`. */
  min?: string | undefined
  /** Latest selectable date, `YYYY-MM-DD`. */
  max?: string | undefined
  controlAttrs?: UiControlAttrs | undefined
}

defineOptions({ name: 'UiDateInput', inheritAttrs: false })

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
  min,
  max,
  controlAttrs,
} = defineProps<UiDateInputProps>()

const emit = defineEmits<{
  /** The date changed: `YYYY-MM-DD`, or `null` when cleared. */
  'update:modelValue': [value: string | null]
}>()

defineSlots<{ label?(): unknown; hint?(): unknown }>()

const control = useControl<HTMLInputElement>(() => controlAttrs)

function read(event: Event): void {
  const value = (event.target as HTMLInputElement).value
  emit('update:modelValue', value === '' ? null : value)
}

defineExpose({
  focus: (options?: FocusOptions) => control.element.value?.focus(options),
  /** Open the browser's date picker where supported. */
  showPicker: () => control.element.value?.showPicker?.(),
  get element() {
    return control.element.value
  },
})
</script>

<template>
  <UiField
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
        class="vui-input"
        :data-invalid="field.invalid ? '' : undefined"
        :data-disabled="disabled ? '' : undefined"
      >
        <input
          v-bind="control.nativeAttrs.value"
          :id="field.id"
          :ref="control.setElement"
          class="vui-input__control"
          type="date"
          :value="modelValue ?? ''"
          :min="min"
          :max="max"
          :disabled="disabled"
          :required="required"
          :aria-invalid="field.invalid ? 'true' : undefined"
          :aria-describedby="control.describedBy(field.describedBy)"
          @input="read"
        />
      </div>
    </template>
    <template v-if="$slots.label" #label><slot name="label" /></template>
    <template v-if="$slots.hint" #hint><slot name="hint" /></template>
  </UiField>
</template>
