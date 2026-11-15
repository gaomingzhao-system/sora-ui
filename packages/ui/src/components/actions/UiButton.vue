<script setup lang="ts" vapor>
import { computed, useTemplateRef } from 'vue'
import type { ButtonHTMLAttributes } from 'vue'
import { useUiDefaults } from '../../composables/use-ui-config.ts'
import type { UiColor, UiSize, UiVariant } from '../../types/common.ts'

export interface UiButtonProps extends /* @vue-ignore */ Omit<ButtonHTMLAttributes, 'type' | 'disabled'> {
  variant?: UiVariant | undefined
  color?: UiColor | undefined
  size?: UiSize | undefined
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

defineOptions({ name: 'UiButton' })

const {
  variant,
  color,
  size,
  type = 'button',
  disabled = false,
  loading = false,
  block = false,
} = defineProps<UiButtonProps>()

defineSlots<{
  /** Label. Stays in the accessibility tree while loading. */
  default?(): unknown
  /** Icon before the label. */
  leading?(): unknown
  /** Icon after the label. */
  trailing?(): unknown
}>()

const defaults = useUiDefaults('button')
const resolvedVariant = computed(() => variant ?? defaults().variant)
const resolvedColor = computed(() => color ?? defaults().color)
const resolvedSize = computed(() => size ?? defaults().size)

const element = useTemplateRef<HTMLButtonElement>('element')

/**
 * Runs in the capture phase on the button itself, i.e. before any listener a
 * caller attached, so a loading button cannot be activated twice by pointer,
 * keyboard or implicit form submission.
 */
function blockWhileLoading(event: MouseEvent): void {
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
    class="vui-button"
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
    <span v-if="loading" class="vui-button__spinner" aria-hidden="true" />
    <span v-if="$slots.leading" class="vui-button__icon"><slot name="leading" /></span>
    <span v-if="$slots.default" class="vui-button__label"><slot /></span>
    <span v-if="$slots.trailing" class="vui-button__icon"><slot name="trailing" /></span>
  </button>
</template>
