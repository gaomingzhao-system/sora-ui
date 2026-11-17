<script setup lang="ts" vapor>
import { computed } from 'vue'
import type { InputHTMLAttributes } from 'vue'
import { useControl } from '../../composables/use-control.ts'
import { useSoraDefaults } from '../../composables/use-sora-config.ts'
import { useSoraId } from '../../internal/ids.ts'
import type { SoraColor, SoraControlAttrs, SoraSize } from '../../types/common.ts'

export interface SoraSwitchProps
  extends /* @vue-ignore */ Omit<
    InputHTMLAttributes,
    'size' | 'type' | 'checked' | 'disabled' | 'required' | 'id'
  > {
  /** On/off only: a switch has no mixed state. `null`/`undefined` are treated as off. */
  modelValue: boolean | null | undefined
  label?: string | undefined
  hint?: string | undefined
  disabled?: boolean | undefined
  required?: boolean | undefined
  size?: SoraSize | undefined
  /** Colour of the track when on. Green (`success`), as on iOS, unless set. */
  color?: SoraColor | undefined
  id?: string | undefined
  /** Put the label before the switch (settings rows). */
  labelPlacement?: 'start' | 'end' | undefined
  controlAttrs?: SoraControlAttrs | undefined
}

defineOptions({ name: 'SoraSwitch', inheritAttrs: false })

const {
  modelValue,
  label,
  hint,
  disabled = false,
  required = false,
  size,
  color = 'success',
  id,
  labelPlacement = 'end',
  controlAttrs,
} = defineProps<SoraSwitchProps>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

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
const hasHint = computed(() => Boolean(slots.hint) || Boolean(hint))

function onChange(event: Event): void {
  const element = event.target as HTMLInputElement
  // A switch is never mixed, even if something set the property.
  element.indeterminate = false
  emit('update:modelValue', element.checked)
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
    class="sora-switch"
    :data-size="resolvedSize"
    :data-color="color"
    :data-label-placement="labelPlacement"
    :data-disabled="disabled ? '' : undefined"
  >
    <label class="sora-switch__row">
      <span class="sora-switch__track">
        <input
          v-bind="control.nativeAttrs.value"
          :id="controlId"
          :ref="control.setElement"
          class="sora-switch__input"
          type="checkbox"
          role="switch"
          switch
          :checked="modelValue === true"
          :disabled="disabled"
          :required="required"
          :aria-describedby="control.describedBy(hasHint ? hintId : undefined)"
          @change="onChange"
        />
        <span class="sora-switch__thumb" aria-hidden="true" />
      </span>
      <span v-if="$slots.default || label" class="sora-switch__label">
        <slot>{{ label }}</slot>
      </span>
    </label>
    <p v-if="hasHint" :id="hintId" class="sora-switch__hint">
      <slot name="hint">{{ hint }}</slot>
    </p>
  </div>
</template>
