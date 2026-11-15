<script setup lang="ts" vapor generic="T extends string | number">
import { computed, useTemplateRef } from 'vue'
import type { HTMLAttributes } from 'vue'
import { useControl } from '../../composables/use-control.ts'
import { useUiDefaults } from '../../composables/use-ui-config.ts'
import { omitKeys } from '../../internal/attributes.ts'
import { useUiId } from '../../internal/ids.ts'
import type { UiControlAttrs, UiOption, UiOrientation, UiSize } from '../../types/common.ts'
import UiField from './UiField.vue'

export interface UiRadioGroupProps<TValue extends string | number = string>
  extends /* @vue-ignore */ HTMLAttributes {
  /** The selected value, or `null`/`undefined` when nothing is selected. */
  modelValue: TValue | null | undefined
  options: readonly UiOption<TValue>[]
  /** Group label, rendered as the `<legend>`. */
  label?: string | undefined
  hint?: string | undefined
  error?: string | readonly string[] | null | undefined
  required?: boolean | undefined
  disabled?: boolean | undefined
  invalid?: boolean | undefined
  size?: UiSize | undefined
  orientation?: UiOrientation | undefined
  /** Native `name` that groups the radios. Generated when omitted. */
  name?: string | undefined
  /** Applied to every native radio; `ref` is called once per radio. */
  controlAttrs?: UiControlAttrs | undefined
}

defineOptions({ name: 'UiRadioGroup', inheritAttrs: false })

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
} = defineProps<UiRadioGroupProps<T>>()

const emit = defineEmits<{
  /** A radio was chosen. Selecting always yields a value. */
  'update:modelValue': [value: T]
}>()

defineSlots<{
  label?(): unknown
  hint?(): unknown
  /** Label content of one option. */
  option?(props: { option: UiOption<T>; checked: boolean }): unknown
}>()

const defaults = useUiDefaults('control')
const resolvedSize = computed(() => size ?? defaults().size)
const control = useControl(() => undefined)
const generated = useUiId()
// Native radios with one name give arrow-key navigation and single selection for free.
const groupName = computed(() => controlAttrs?.name ?? name ?? `${generated}-group`)
const radioAttrs = computed(() =>
  omitKeys((controlAttrs ?? {}) as Record<string, unknown>, ['ref', 'name', 'aria-describedby']),
)
const list = useTemplateRef<HTMLElement>('list')

function register(element: unknown): void {
  controlAttrs?.ref?.(element instanceof Element ? element : null)
}

defineExpose({
  /** Focus the selected radio, or the first enabled one. */
  focus: (focusOptions?: FocusOptions) => {
    const radios = [
      ...(list.value?.querySelectorAll<HTMLInputElement>('input[type="radio"]:not(:disabled)') ?? []),
    ]
    const target = radios.find((radio) => radio.checked) ?? radios[0]
    target?.focus(focusOptions)
  },
})
</script>

<template>
  <UiField
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
      <div ref="list" class="vui-option-list" :data-orientation="orientation">
        <div
          v-for="(option, index) in options"
          :key="option.value"
          class="vui-check"
          data-kind="radio"
          :data-size="resolvedSize"
          :data-invalid="field.invalid ? '' : undefined"
          :data-disabled="disabled || option.disabled ? '' : undefined"
        >
          <label class="vui-check__row">
            <span class="vui-check__box">
              <input
                v-bind="radioAttrs"
                :ref="register"
                class="vui-check__input"
                type="radio"
                :name="groupName"
                :value="String(option.value)"
                :checked="modelValue === option.value"
                :disabled="disabled || option.disabled"
                :required="required"
                :aria-invalid="field.invalid ? 'true' : undefined"
                :aria-describedby="option.description ? `${generated}-option-${index}` : undefined"
                @change="emit('update:modelValue', option.value)"
              />
              <span class="vui-check__dot" aria-hidden="true" />
            </span>
            <span class="vui-check__label">
              <slot name="option" :option="option" :checked="modelValue === option.value">{{
                option.label
              }}</slot>
            </span>
          </label>
          <p v-if="option.description" :id="`${generated}-option-${index}`" class="vui-check__hint">
            {{ option.description }}
          </p>
        </div>
      </div>
    </template>
    <template v-if="$slots.label" #label><slot name="label" /></template>
    <template v-if="$slots.hint" #hint><slot name="hint" /></template>
  </UiField>
</template>
