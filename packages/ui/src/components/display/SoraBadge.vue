<script setup lang="ts" vapor>
import { computed } from 'vue'
import type { HTMLAttributes } from 'vue'
import { useSoraDefaults } from '../../composables/use-sora-config.ts'
import type { SoraColor, SoraSize } from '../../types/common.ts'

export interface SoraBadgeProps extends /* @vue-ignore */ HTMLAttributes {
  variant?: 'solid' | 'soft' | 'outline' | undefined
  color?: SoraColor | undefined
  size?: SoraSize | undefined
  /** Show a small status dot before the label (decorative; the text carries the meaning). */
  dot?: boolean | undefined
}

defineOptions({ name: 'SoraBadge' })

const { variant, color, size, dot = false } = defineProps<SoraBadgeProps>()

defineSlots<{
  default?(): unknown
  /** Icon before the label. */
  leading?(): unknown
}>()

const defaults = useSoraDefaults('badge')
const resolvedVariant = computed(() => variant ?? defaults().variant)
const resolvedColor = computed(() => color ?? defaults().color)
const resolvedSize = computed(() => size ?? defaults().size)
</script>

<template>
  <span
    class="sora-badge"
    :data-variant="resolvedVariant"
    :data-color="resolvedColor"
    :data-size="resolvedSize"
  >
    <span v-if="dot" class="sora-badge__dot" aria-hidden="true" />
    <slot name="leading" />
    <slot />
  </span>
</template>
