<script setup lang="ts" vapor>
import { computed } from 'vue'
import type { HTMLAttributes } from 'vue'
import { useUiDefaults } from '../../composables/use-ui-config.ts'
import { mergeIds } from '../../internal/attributes.ts'
import { iconError } from '../../internal/icons.ts'
import { useUiId } from '../../internal/ids.ts'
import type { UiSize } from '../../types/common.ts'
import UiIcon from '../foundation/UiIcon.vue'

export interface UiFieldProps extends /* @vue-ignore */ HTMLAttributes {
  label?: string | undefined
  /** Helper text, associated with the control through `aria-describedby`. */
  hint?: string | undefined
  /** Error message(s). A non-empty value also marks the field invalid. */
  error?: string | readonly string[] | null | undefined
  required?: boolean | undefined
  disabled?: boolean | undefined
  /** Mark invalid without showing a message. */
  invalid?: boolean | undefined
  size?: UiSize | undefined
  /** Id for the control. Generated (and stable) when omitted. */
  id?: string | undefined
  /** `fieldset` renders a `<fieldset>` with a `<legend>` for groups of controls. */
  as?: 'div' | 'fieldset' | undefined
  /** Keep the label for assistive technology but hide it visually. */
  hideLabel?: boolean | undefined
  /** `horizontal` places the label beside the control when the container is wide enough. */
  orientation?: 'vertical' | 'horizontal' | undefined
}

/** Wiring a control needs to be labelled, described and marked invalid. */
export interface UiFieldSlotProps {
  /** Put this on the control (`id`). The label's `for` points at it. */
  id: string
  labelId: string
  /** Ids of the hint and error elements that are currently rendered. */
  describedBy: string | undefined
  invalid: boolean
  required: boolean
  disabled: boolean
}

defineOptions({ name: 'UiField' })

const {
  label,
  hint,
  error,
  required = false,
  disabled = false,
  invalid = false,
  size,
  id,
  as = 'div',
  hideLabel = false,
  orientation = 'vertical',
} = defineProps<UiFieldProps>()

const slots = defineSlots<{
  /** The control. Bind `id`, `aria-describedby` and `aria-invalid` from the slot props. */
  default?(props: UiFieldSlotProps): unknown
  label?(): unknown
  hint?(): unknown
  error?(props: { messages: readonly string[] }): unknown
}>()

const defaults = useUiDefaults('control')
const resolvedSize = computed(() => size ?? defaults().size)

const generated = useUiId()
const controlId = computed(() => id ?? `${generated}-control`)
const labelId = `${generated}-label`
const hintId = `${generated}-hint`
const errorId = `${generated}-error`

const messages = computed<readonly string[]>(() => {
  if (error == null || error === '') return []
  return typeof error === 'string' ? [error] : error.filter(Boolean)
})
const hasHint = computed(() => Boolean(slots.hint) || Boolean(hint))
const hasError = computed(() => messages.value.length > 0)
const isInvalid = computed(() => invalid || hasError.value)
const describedBy = computed(() =>
  mergeIds(hasHint.value ? hintId : undefined, hasError.value ? errorId : undefined),
)
</script>

<template>
  <component
    :is="as"
    class="vui-field"
    :data-size="resolvedSize"
    :data-orientation="orientation"
    :data-invalid="isInvalid ? '' : undefined"
    :data-disabled="disabled ? '' : undefined"
    :disabled="as === 'fieldset' && disabled ? true : undefined"
    :aria-describedby="as === 'fieldset' ? describedBy : undefined"
  >
    <component
      :is="as === 'fieldset' ? 'legend' : 'label'"
      v-if="$slots.label || label"
      :id="labelId"
      class="vui-field__label"
      :for="as === 'fieldset' ? undefined : controlId"
      :data-visually-hidden="hideLabel ? '' : undefined"
    >
      <slot name="label">{{ label }}</slot>
      <!-- Decorative marker: the control itself carries `required`. -->
      <span v-if="required" class="vui-field__required" aria-hidden="true">*</span>
    </component>
    <div class="vui-field__control">
      <slot
        :id="controlId"
        :label-id="labelId"
        :described-by="describedBy"
        :invalid="isInvalid"
        :required="required"
        :disabled="disabled"
      />
    </div>
    <p v-if="hasHint" :id="hintId" class="vui-field__hint">
      <slot name="hint">{{ hint }}</slot>
    </p>
    <div v-if="hasError" :id="errorId" class="vui-field__error">
      <slot name="error" :messages="messages">
        <p v-for="message in messages" :key="message" class="vui-field__message">
          <UiIcon :icon="iconError" class="vui-field__error-icon" />
          <span>{{ message }}</span>
        </p>
      </slot>
    </div>
  </component>
</template>
