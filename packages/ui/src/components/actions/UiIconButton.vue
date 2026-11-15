<script setup lang="ts" vapor>
import { computed, useTemplateRef } from 'vue'
import type { ButtonHTMLAttributes } from 'vue'
import { useUiDefaults } from '../../composables/use-ui-config.ts'
import type { UiColor, UiIconDefinition, UiSize, UiVariant } from '../../types/common.ts'
import UiIcon from '../foundation/UiIcon.vue'
import UiButton from './UiButton.vue'

export interface UiIconButtonProps
  extends /* @vue-ignore */ Omit<ButtonHTMLAttributes, 'type' | 'disabled' | 'aria-label'> {
  /** Accessible name. Required: an icon alone does not name a control. */
  label: string
  /** Glyph to show. Use the default slot for custom content instead. */
  icon?: UiIconDefinition | undefined
  variant?: UiVariant | undefined
  color?: UiColor | undefined
  size?: UiSize | undefined
  type?: 'button' | 'submit' | 'reset' | undefined
  disabled?: boolean | undefined
  loading?: boolean | undefined
}

defineOptions({ name: 'UiIconButton' })

const {
  label,
  icon,
  variant,
  color,
  size,
  type = 'button',
  disabled = false,
  loading = false,
} = defineProps<UiIconButtonProps>()

defineSlots<{
  /** Custom decorative content. It must not carry its own accessible name. */
  default?(): unknown
}>()

const defaults = useUiDefaults('iconButton')
const resolvedVariant = computed(() => variant ?? defaults().variant)
const resolvedColor = computed(() => color ?? defaults().color)
const resolvedSize = computed(() => size ?? defaults().size)

const button = useTemplateRef('button')

defineExpose({
  focus: (options?: FocusOptions) => button.value?.focus(options),
  get element() {
    return button.value?.element
  },
})
</script>

<template>
  <UiButton
    ref="button"
    class="vui-icon-button"
    :aria-label="label"
    :variant="resolvedVariant"
    :color="resolvedColor"
    :size="resolvedSize"
    :type="type"
    :disabled="disabled"
    :loading="loading"
  >
    <template #leading>
      <slot><UiIcon v-if="icon" :icon="icon" /></slot>
    </template>
  </UiButton>
</template>
