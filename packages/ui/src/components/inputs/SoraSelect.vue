<script setup lang="ts" vapor generic="T extends string | number">
import { computed, type SelectHTMLAttributes } from 'vue'
import { useControl } from '../../composables/use-control.ts'
import { useSoraLocale } from '../../composables/use-sora-locale.ts'
import { iconChevronDown } from '../../internal/icons.ts'
import type { SoraControlAttrs, SoraOption, SoraOptionGroup, SoraSize } from '../../types/common.ts'
import SoraIcon from '../foundation/SoraIcon.vue'
import SoraField from './SoraField.vue'

export interface SoraSelectProps<TValue extends string | number = string>
  extends /* @vue-ignore */ Omit<
    SelectHTMLAttributes,
    'size' | 'value' | 'disabled' | 'required' | 'id' | 'multiple'
  > {
  /** The selected option's typed value; `null`/`undefined` select the empty option. */
  modelValue: TValue | null | undefined
  /** Options, optionally grouped (groups render as `<optgroup>`). */
  options: readonly (SoraOption<TValue> | SoraOptionGroup<TValue>)[]
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
  /** Text of the empty option shown while nothing is selected. */
  placeholder?: string | undefined
  controlAttrs?: SoraControlAttrs | undefined
}

defineOptions({ name: 'SoraSelect', inheritAttrs: false })

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
  id,
  hideLabel = false,
  orientation = 'vertical',
  placeholder,
  controlAttrs,
} = defineProps<SoraSelectProps<T>>()

const emit = defineEmits<{
  /** The typed value of the chosen option, or `null` for the empty option. */
  'update:modelValue': [value: T | null]
}>()

defineSlots<{ label?(): unknown; hint?(): unknown }>()

const { t } = useSoraLocale()
const control = useControl<HTMLSelectElement>(() => controlAttrs)

const isGroup = (entry: SoraOption<T> | SoraOptionGroup<T>): entry is SoraOptionGroup<T> => 'options' in entry

const flat = computed(() => options.flatMap((entry) => (isGroup(entry) ? entry.options : [entry])))
// Native values are strings: one map from that string back to the typed option.
const byValue = computed(() => new Map(flat.value.map((option) => [String(option.value), option])))
// The empty option exists whenever "nothing" is a possible or current state.
const showEmpty = computed(() => placeholder !== undefined || modelValue == null)

const onChange = (event: Event): void => {
  const raw = (event.target as HTMLSelectElement).value
  emit('update:modelValue', byValue.value.get(raw)?.value ?? null)
}

defineExpose({
  focus: (focusOptions?: FocusOptions) => control.element.value?.focus(focusOptions),
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
        class="sora-input sora-select"
        :data-invalid="field.invalid ? '' : undefined"
        :data-disabled="disabled ? '' : undefined"
      >
        <select
          v-bind="control.nativeAttrs.value"
          :id="field.id"
          :ref="control.setElement"
          class="sora-input__control sora-select__control"
          :disabled="disabled"
          :required="required"
          :data-placeholder="modelValue == null ? '' : undefined"
          :aria-invalid="field.invalid ? 'true' : undefined"
          :aria-describedby="control.describedBy(field.describedBy)"
          @change="onChange"
        >
          <option v-if="showEmpty" value="" :selected="modelValue == null" :disabled="required">
            {{ placeholder ?? t('select.placeholder') }}
          </option>
          <template v-for="entry in options" :key="isGroup(entry) ? `group:${entry.label}` : entry.value">
            <optgroup v-if="isGroup(entry)" :label="entry.label" :disabled="entry.disabled">
              <option
                v-for="option in entry.options"
                :key="option.value"
                :value="String(option.value)"
                :selected="option.value === modelValue"
                :disabled="option.disabled"
              >
                {{ option.label }}
              </option>
            </optgroup>
            <option
              v-else
              :value="String(entry.value)"
              :selected="entry.value === modelValue"
              :disabled="entry.disabled"
            >
              {{ entry.label }}
            </option>
          </template>
        </select>
        <SoraIcon :icon="iconChevronDown" class="sora-select__chevron" />
      </div>
    </template>
    <template v-if="$slots.label" #label><slot name="label" /></template>
    <template v-if="$slots.hint" #hint><slot name="hint" /></template>
  </SoraField>
</template>
