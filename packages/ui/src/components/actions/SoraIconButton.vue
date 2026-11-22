<script setup lang="ts" vapor>
import { computed, useTemplateRef, type ButtonHTMLAttributes } from 'vue'
import { useSoraDefaults } from '../../composables/use-sora-config.ts'
import type { SoraColor, SoraIconDefinition, SoraSize, SoraVariant } from '../../types/common.ts'
import SoraIcon from '../foundation/SoraIcon.vue'
import SoraButton from './SoraButton.vue'

export interface SoraIconButtonProps
  extends /* @vue-ignore */ Omit<ButtonHTMLAttributes, 'type' | 'disabled' | 'aria-label'> {
  /** Accessible name. Required: an icon alone does not name a control. */
  label: string
  /** Glyph to show. Use the default slot for custom content instead. */
  icon?: SoraIconDefinition | undefined
  variant?: SoraVariant | undefined
  color?: SoraColor | undefined
  size?: SoraSize | undefined
  type?: 'button' | 'submit' | 'reset' | undefined
  disabled?: boolean | undefined
  loading?: boolean | undefined
}

defineOptions({ name: 'SoraIconButton' })

const {
  label,
  icon,
  variant,
  color,
  size,
  type = 'button',
  disabled = false,
  loading = false,
} = defineProps<SoraIconButtonProps>()

defineSlots<{
  /** Custom decorative content. It must not carry its own accessible name. */
  default?(): unknown
}>()

const defaults = useSoraDefaults('iconButton')
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
  <SoraButton
    ref="button"
    class="sora-icon-button"
    :aria-label="label"
    :variant="resolvedVariant"
    :color="resolvedColor"
    :size="resolvedSize"
    :type="type"
    :disabled="disabled"
    :loading="loading"
  >
    <template #leading>
      <slot><SoraIcon v-if="icon" :icon="icon" /></slot>
    </template>
  </SoraButton>
</template>
