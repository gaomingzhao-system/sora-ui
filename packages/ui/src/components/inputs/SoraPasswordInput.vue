<script setup lang="ts" vapor>
import { useTemplateRef, type InputHTMLAttributes } from 'vue'
import { useSoraLocale } from '../../composables/use-sora-locale.ts'
import { iconEye, iconEyeOff } from '../../internal/icons.ts'
import type { SoraControlAttrs, SoraSize } from '../../types/common.ts'
import SoraIcon from '../foundation/SoraIcon.vue'
import SoraInput from './SoraInput.vue'

export interface SoraPasswordInputProps
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
  /** Offer a button that reveals the password. */
  revealable?: boolean | undefined
  controlAttrs?: SoraControlAttrs | undefined
}

defineOptions({ name: 'SoraPasswordInput' })

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
  revealable = true,
  controlAttrs,
} = defineProps<SoraPasswordInputProps>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()
/** Whether the password is currently shown as plain text. */
const revealed = defineModel<boolean>('revealed', { default: false })

defineSlots<{ label?(): unknown; hint?(): unknown; leading?(): unknown }>()

const { t } = useSoraLocale()
const input = useTemplateRef('input')

defineExpose({
  focus: (options?: FocusOptions) => input.value?.focus(options),
  select: () => input.value?.select(),
  get element() {
    return input.value?.element
  },
})
</script>

<template>
  <SoraInput
    :id="id"
    ref="input"
    :model-value="modelValue"
    autocomplete="current-password"
    :type="revealed ? 'text' : 'password'"
    :label="label"
    :hint="hint"
    :error="error"
    :required="required"
    :disabled="disabled"
    :invalid="invalid"
    :size="size"
    :hide-label="hideLabel"
    :orientation="orientation"
    :control-attrs="controlAttrs"
    spellcheck="false"
    autocapitalize="none"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <template v-if="$slots.leading" #leading><slot name="leading" /></template>
    <template v-if="revealable" #trailing>
      <!-- A toggle button: the name stays the same, aria-pressed carries the state. -->
      <button
        type="button"
        class="sora-input__button"
        :disabled="disabled"
        :aria-label="t('password.show')"
        :aria-pressed="revealed ? 'true' : 'false'"
        @click="revealed = !revealed"
      >
        <SoraIcon :icon="revealed ? iconEyeOff : iconEye" />
      </button>
    </template>
    <template v-if="$slots.label" #label><slot name="label" /></template>
    <template v-if="$slots.hint" #hint><slot name="hint" /></template>
  </SoraInput>
</template>
