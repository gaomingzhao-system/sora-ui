<script setup lang="ts" vapor>
import { computed, onMounted, watch, type InputHTMLAttributes } from 'vue'
import { useControl } from '../../composables/use-control.ts'
import { useSoraDefaults } from '../../composables/use-sora-config.ts'
import { iconCheck, iconError, iconMinus } from '../../internal/icons.ts'
import { useSoraId } from '../../internal/ids.ts'
import type { SoraControlAttrs, SoraSize } from '../../types/common.ts'
import SoraIcon from '../foundation/SoraIcon.vue'

export interface SoraCheckboxProps
  extends /* @vue-ignore */ Omit<
    InputHTMLAttributes,
    'size' | 'type' | 'checked' | 'disabled' | 'required' | 'id' | 'indeterminate'
  > {
  /** Checked state. `null`/`undefined` are treated as unchecked. */
  modelValue: boolean | null | undefined
  label?: string | undefined
  hint?: string | undefined
  error?: string | readonly string[] | null | undefined
  required?: boolean | undefined
  disabled?: boolean | undefined
  invalid?: boolean | undefined
  size?: SoraSize | undefined
  id?: string | undefined
  controlAttrs?: SoraControlAttrs | undefined
}

defineOptions({ name: 'SoraCheckbox', inheritAttrs: false })

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
  controlAttrs,
} = defineProps<SoraCheckboxProps>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()
/**
 * Mixed state ("some selected"). It is the native `indeterminate` property,
 * so it is announced as "mixed"; any user toggle clears it.
 */
const indeterminate = defineModel<boolean>('indeterminate', { default: false })

const slots = defineSlots<{
  /** Label content (replaces `label`). */
  default?(): unknown
  hint?(): unknown
}>()

const defaults = useSoraDefaults('control')
const resolvedSize = computed(() => size ?? defaults().size)
const control = useControl<HTMLInputElement>(() => controlAttrs)

const generated = useSoraId()
const controlId = computed(() => id ?? `${generated}-control`)
const hintId = `${generated}-hint`
const errorId = `${generated}-error`

const messages = computed<readonly string[]>(() => {
  if (error == null || error === '') return []
  return typeof error === 'string' ? [error] : error.filter(Boolean)
})
const hasHint = computed(() => Boolean(slots.hint) || Boolean(hint))
const isInvalid = computed(() => invalid || messages.value.length > 0)

// `indeterminate` is a DOM property with no attribute; keep it in sync by hand.
const syncIndeterminate = (): void => {
  const element = control.element.value
  if (element) element.indeterminate = indeterminate.value
}
watch(indeterminate, syncIndeterminate, { flush: 'post' })
onMounted(syncIndeterminate)

const onChange = (event: Event): void => {
  emit('update:modelValue', (event.target as HTMLInputElement).checked)
  indeterminate.value = false
}

defineExpose({
  focus: (options?: FocusOptions) => control.element.value?.focus(options),
  get element() {
    return control.element.value
  },
})
</script>

<template>
  <div
    v-bind="control.rootAttrs.value"
    class="sora-check"
    :data-size="resolvedSize"
    :data-invalid="isInvalid ? '' : undefined"
    :data-disabled="disabled ? '' : undefined"
  >
    <label class="sora-check__row">
      <span class="sora-check__box">
        <input
          v-bind="control.nativeAttrs.value"
          :id="controlId"
          :ref="control.setElement"
          class="sora-check__input"
          type="checkbox"
          :checked="modelValue === true"
          :disabled="disabled"
          :required="required"
          :aria-invalid="isInvalid ? 'true' : undefined"
          :aria-describedby="
            control.describedBy(hasHint ? hintId : undefined, messages.length ? errorId : undefined)
          "
          @change="onChange"
        />
        <SoraIcon :icon="iconCheck" class="sora-check__mark sora-check__mark--checked" />
        <SoraIcon :icon="iconMinus" class="sora-check__mark sora-check__mark--mixed" />
      </span>
      <span v-if="$slots.default || label" class="sora-check__label">
        <slot>{{ label }}</slot>
        <span v-if="required" class="sora-field__required" aria-hidden="true">*</span>
      </span>
    </label>
    <p v-if="hasHint" :id="hintId" class="sora-check__hint">
      <slot name="hint">{{ hint }}</slot>
    </p>
    <div v-if="messages.length" :id="errorId" class="sora-field__error sora-check__error">
      <p v-for="message in messages" :key="message" class="sora-field__message">
        <SoraIcon :icon="iconError" class="sora-field__error-icon" />
        <span>{{ message }}</span>
      </p>
    </div>
  </div>
</template>
