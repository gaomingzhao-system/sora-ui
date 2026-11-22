<script setup lang="ts" vapor>
import { computed, onMounted, shallowRef, watch, type InputHTMLAttributes } from 'vue'
import { useControl } from '../../composables/use-control.ts'
import { useSoraLocale } from '../../composables/use-sora-locale.ts'
import { iconMinus, iconPlus } from '../../internal/icons.ts'
import type { SoraControlAttrs, SoraSize } from '../../types/common.ts'
import SoraIcon from '../foundation/SoraIcon.vue'
import SoraField from './SoraField.vue'

export interface SoraNumberInputProps
  extends /* @vue-ignore */ Omit<
    InputHTMLAttributes,
    'size' | 'type' | 'value' | 'disabled' | 'required' | 'id' | 'min' | 'max' | 'step'
  > {
  /**
   * The number, or `null` when the field is empty or holds text the browser
   * cannot parse. Never coerced to `0`. `undefined` is treated like `null`.
   */
  modelValue: number | null | undefined
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
  min?: number | undefined
  max?: number | undefined
  step?: number | 'any' | undefined
  /** Show decrement/increment buttons. */
  controls?: boolean | undefined
  controlAttrs?: SoraControlAttrs | undefined
}

defineOptions({ name: 'SoraNumberInput', inheritAttrs: false })

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
  step,
  controls = false,
  controlAttrs,
} = defineProps<SoraNumberInputProps>()

const emit = defineEmits<{
  /** The number changed. `null` means empty or unparsable. */
  'update:modelValue': [value: number | null]
}>()

defineSlots<{ label?(): unknown; hint?(): unknown; leading?(): unknown; trailing?(): unknown }>()

const { t } = useSoraLocale()
const control = useControl<HTMLInputElement>(() => controlAttrs)

/** True while the field holds text that is not a number (`validity.badInput`). */
const badInput = shallowRef(false)
const resolvedError = computed(() => error ?? (badInput.value ? t('number.invalid') : undefined))

const read = (): void => {
  const element = control.element.value
  if (!element) return
  badInput.value = element.validity.badInput
  const value = element.valueAsNumber
  const next = Number.isNaN(value) ? null : value
  if (next !== (modelValue ?? null)) emit('update:modelValue', next)
}

// The DOM value is written only when it differs *numerically* from the
// model, so "1.0" or "1e" being typed is never replaced mid-keystroke.
const write = (input: number | null | undefined): void => {
  const value = input ?? null
  const element = control.element.value
  if (!element) return
  const current = element.valueAsNumber
  if (value === null) {
    if (!Number.isNaN(current) || (element.value !== '' && !element.validity.badInput)) element.value = ''
    if (!element.validity.badInput) badInput.value = false
  } else if (current !== value) {
    element.value = String(value)
    badInput.value = false
  }
}

watch(() => modelValue, write, { flush: 'post' })
onMounted(() => write(modelValue))

const stepBy = (direction: 1 | -1): void => {
  const element = control.element.value
  if (!element || disabled) return
  if (direction === 1) element.stepUp()
  else element.stepDown()
  read()
  // Native steppers fire `input` and `change`; mirror that for listeners and form libraries.
  element.dispatchEvent(new Event('input', { bubbles: true }))
  element.dispatchEvent(new Event('change', { bubbles: true }))
}

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
    :error="resolvedError"
    :required="required"
    :disabled="disabled"
    :invalid="invalid || badInput"
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
          class="sora-input__control sora-input__control--number"
          type="number"
          inputmode="decimal"
          :min="min"
          :max="max"
          :step="step"
          :disabled="disabled"
          :required="required"
          :aria-invalid="field.invalid ? 'true' : undefined"
          :aria-describedby="control.describedBy(field.describedBy)"
          @input="read"
        />
        <span v-if="$slots.trailing" class="sora-input__affix"><slot name="trailing" /></span>
        <span v-if="controls" class="sora-input__steppers">
          <!-- Pointer conveniences: the field itself already steps with the arrow keys. -->
          <button
            type="button"
            class="sora-input__button"
            tabindex="-1"
            :disabled="disabled"
            :aria-label="t('number.decrement')"
            @click="stepBy(-1)"
          >
            <SoraIcon :icon="iconMinus" />
          </button>
          <button
            type="button"
            class="sora-input__button"
            tabindex="-1"
            :disabled="disabled"
            :aria-label="t('number.increment')"
            @click="stepBy(1)"
          >
            <SoraIcon :icon="iconPlus" />
          </button>
        </span>
      </div>
    </template>
    <template v-if="$slots.label" #label><slot name="label" /></template>
    <template v-if="$slots.hint" #hint><slot name="hint" /></template>
  </SoraField>
</template>
