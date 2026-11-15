<script setup lang="ts" vapor>
import { computed } from 'vue'
import type { HTMLAttributes } from 'vue'
import { useUiDefaults } from '../../composables/use-ui-config.ts'
import type { UiColor, UiSize } from '../../types/common.ts'

export interface UiBadgeProps extends /* @vue-ignore */ HTMLAttributes {
  variant?: 'solid' | 'soft' | 'outline' | undefined
  color?: UiColor | undefined
  size?: UiSize | undefined
  /** Show a small status dot before the label (decorative; the text carries the meaning). */
  dot?: boolean | undefined
}

defineOptions({ name: 'UiBadge' })

const { variant, color, size, dot = false } = defineProps<UiBadgeProps>()

defineSlots<{
  default?(): unknown
  /** Icon before the label. */
  leading?(): unknown
}>()

const defaults = useUiDefaults('badge')
const resolvedVariant = computed(() => variant ?? defaults().variant)
const resolvedColor = computed(() => color ?? defaults().color)
const resolvedSize = computed(() => size ?? defaults().size)
</script>

<template>
  <span
    class="vui-badge"
    :data-variant="resolvedVariant"
    :data-color="resolvedColor"
    :data-size="resolvedSize"
  >
    <span v-if="dot" class="vui-badge__dot" aria-hidden="true" />
    <slot name="leading" />
    <slot />
  </span>
</template>
