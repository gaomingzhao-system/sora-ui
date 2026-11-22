<script setup lang="ts" vapor>
import { computed, type InputHTMLAttributes } from 'vue'
import { useControl } from '../../composables/use-control.ts'
import { useSoraLocale } from '../../composables/use-sora-locale.ts'
import type { SoraColor, SoraControlAttrs, SoraSize } from '../../types/common.ts'
import SoraField from './SoraField.vue'

export interface SoraSliderProps
  extends /* @vue-ignore */ Omit<
    InputHTMLAttributes,
    'size' | 'type' | 'value' | 'disabled' | 'id' | 'min' | 'max' | 'step' | 'color'
  > {
  /** The value. `null`/`undefined` are shown as `min`. */
  modelValue: number | null | undefined
  label?: string | undefined
  hint?: string | undefined
  disabled?: boolean | undefined
  size?: SoraSize | undefined
  id?: string | undefined
  hideLabel?: boolean | undefined
  /** `horizontal` puts the label beside the control when the container is wide enough. */
  orientation?: 'vertical' | 'horizontal' | undefined
  min?: number | undefined
  max?: number | undefined
  step?: number | undefined
  color?: SoraColor | undefined
  /** Show the current value next to the track. */
  showValue?: boolean | undefined
  /** Human-readable value (also used for `aria-valuetext`), e.g. `(v) => v + ' %'`. */
  formatValue?: ((value: number) => string) | undefined
  controlAttrs?: SoraControlAttrs | undefined
}

defineOptions({ name: 'SoraSlider', inheritAttrs: false })

const {
  modelValue,
  label,
  hint,
  disabled = false,
  size,
  id,
  hideLabel = false,
  orientation = 'vertical',
  min = 0,
  max = 100,
  step = 1,
  color = 'primary',
  showValue = false,
  formatValue,
  controlAttrs,
} = defineProps<SoraSliderProps>()

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

defineSlots<{ label?(): unknown; hint?(): unknown }>()

const { formatNumber } = useSoraLocale()
const control = useControl<HTMLInputElement>(() => controlAttrs)

const value = computed(() => modelValue ?? min)
const fraction = computed(() => {
  const span = max - min
  return span > 0 ? Math.min(1, Math.max(0, (value.value - min) / span)) : 0
})
const valueText = computed(() => formatValue?.(value.value) ?? formatNumber(value.value))

defineExpose({
  focus: (options?: FocusOptions) => control.element.value?.focus(options),
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
    :disabled="disabled"
    :size="size"
    :hide-label="hideLabel"
    :orientation="orientation"
  >
    <template #default="field">
      <div class="sora-slider" :data-color="color" :data-disabled="disabled ? '' : undefined">
        <!-- Native range input: arrow keys, Home/End, Page Up/Down and RTL mirroring come from the browser. -->
        <input
          v-bind="control.nativeAttrs.value"
          :id="field.id"
          :ref="control.setElement"
          class="sora-slider__input"
          type="range"
          :min="min"
          :max="max"
          :step="step"
          :value="value"
          :disabled="disabled"
          :style="{ '--_fill': fraction }"
          :aria-valuetext="formatValue ? valueText : undefined"
          :aria-describedby="control.describedBy(field.describedBy)"
          @input="emit('update:modelValue', ($event.target as HTMLInputElement).valueAsNumber)"
        />
        <output v-if="showValue" class="sora-slider__value" :for="field.id">{{ valueText }}</output>
      </div>
    </template>
    <template v-if="$slots.label" #label><slot name="label" /></template>
    <template v-if="$slots.hint" #hint><slot name="hint" /></template>
  </SoraField>
</template>
