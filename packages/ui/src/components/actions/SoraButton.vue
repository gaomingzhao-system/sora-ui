<script setup lang="ts" vapor>
import { computed, useTemplateRef, type ButtonHTMLAttributes } from 'vue'
import { useSoraDefaults } from '../../composables/use-sora-config.ts'
import type { SoraColor, SoraSize, SoraVariant } from '../../types/common.ts'

export interface SoraButtonProps extends /* @vue-ignore */ Omit<ButtonHTMLAttributes, 'type' | 'disabled'> {
  variant?: SoraVariant | undefined
  color?: SoraColor | undefined
  size?: SoraSize | undefined
  /** Native button type. Defaults to `button`, never `submit`. */
  type?: 'button' | 'submit' | 'reset' | undefined
  disabled?: boolean | undefined
  /**
   * Shows a spinner and ignores activation while keeping the label, the
   * width and keyboard focus. The button is `aria-disabled`, not `disabled`.
   */
  loading?: boolean | undefined
  /** Stretch to the width of the container. */
  block?: boolean | undefined
}

defineOptions({ name: 'SoraButton' })

const {
  variant,
  color,
  size,
  type = 'button',
  disabled = false,
  loading = false,
  block = false,
} = defineProps<SoraButtonProps>()

defineSlots<{
  /** Label. Stays in the accessibility tree while loading. */
  default?(): unknown
  /** Icon before the label. */
  leading?(): unknown
  /** Icon after the label. */
  trailing?(): unknown
}>()

const defaults = useSoraDefaults('button')
const resolvedVariant = computed(() => variant ?? defaults().variant)
const resolvedColor = computed(() => color ?? defaults().color)
const resolvedSize = computed(() => size ?? defaults().size)

const element = useTemplateRef<HTMLButtonElement>('element')

/**
 * Runs in the capture phase on the button itself, i.e. before any listener a
 * caller attached, so a loading button cannot be activated twice by pointer,
 * keyboard or implicit form submission.
 */
const blockWhileLoading = (event: MouseEvent): void => {
  if (!loading) return
  event.preventDefault()
  event.stopImmediatePropagation()
}

defineExpose({
  focus: (options?: FocusOptions) => element.value?.focus(options),
  /** The native button element. */
  get element() {
    return element.value
  },
})
</script>

<template>
  <button
    ref="element"
    class="sora-button"
    :type="type"
    :disabled="disabled"
    :data-variant="resolvedVariant"
    :data-color="resolvedColor"
    :data-size="resolvedSize"
    :data-block="block ? '' : undefined"
    :data-loading="loading ? '' : undefined"
    :aria-busy="loading ? 'true' : undefined"
    :aria-disabled="loading ? 'true' : undefined"
    @click.capture="blockWhileLoading"
  >
    <span v-if="loading" class="sora-button__spinner" aria-hidden="true" />
    <span v-if="$slots.leading" class="sora-button__icon"><slot name="leading" /></span>
    <span v-if="$slots.default" class="sora-button__label"><slot /></span>
    <span v-if="$slots.trailing" class="sora-button__icon"><slot name="trailing" /></span>
  </button>
</template>
