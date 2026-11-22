<script setup lang="ts" vapor>
import { computed, type TextareaHTMLAttributes } from 'vue'
import { useControl } from '../../composables/use-control.ts'
import type { SoraControlAttrs, SoraSize } from '../../types/common.ts'
import SoraField from './SoraField.vue'

export interface SoraTextareaProps
  extends /* @vue-ignore */ Omit<TextareaHTMLAttributes, 'value' | 'disabled' | 'required' | 'id' | 'rows'> {
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
  /** Visible lines (and the minimum height when `autosize` is on). */
  rows?: number | undefined
  /** Grow with the content (`field-sizing: content`) between `rows` and `maxRows`. */
  autosize?: boolean | undefined
  maxRows?: number | undefined
  controlAttrs?: SoraControlAttrs | undefined
}

defineOptions({ name: 'SoraTextarea', inheritAttrs: false })

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
  rows = 3,
  autosize = false,
  maxRows = 8,
  controlAttrs,
} = defineProps<SoraTextareaProps>()

const emit = defineEmits<{
  /** The text changed. Always a string. */
  'update:modelValue': [value: string]
}>()

const model = computed({
  get: () => modelValue ?? '',
  set: (value: string) => emit('update:modelValue', value),
})

defineSlots<{ label?(): unknown; hint?(): unknown }>()

const control = useControl<HTMLTextAreaElement>(() => controlAttrs)

defineExpose({
  focus: (options?: FocusOptions) => control.element.value?.focus(options),
  select: () => control.element.value?.select(),
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
      <textarea
        v-bind="control.nativeAttrs.value"
        :id="field.id"
        :ref="control.setElement"
        v-model="model"
        class="sora-textarea"
        :rows="rows"
        :disabled="disabled"
        :required="required"
        :data-autosize="autosize ? '' : undefined"
        :data-invalid="field.invalid ? '' : undefined"
        :style="{ '--_rows': rows, '--_max-rows': maxRows }"
        :aria-invalid="field.invalid ? 'true' : undefined"
        :aria-describedby="control.describedBy(field.describedBy)"
      />
    </template>
    <template v-if="$slots.label" #label><slot name="label" /></template>
    <template v-if="$slots.hint" #hint><slot name="hint" /></template>
  </SoraField>
</template>
