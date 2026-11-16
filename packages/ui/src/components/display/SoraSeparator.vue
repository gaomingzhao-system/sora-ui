<script setup lang="ts" vapor>
import type { HTMLAttributes } from 'vue'
import type { SoraOrientation } from '../../types/common.ts'

export interface SoraSeparatorProps extends /* @vue-ignore */ HTMLAttributes {
  orientation?: SoraOrientation | undefined
  /**
   * Decorative separators are hidden from assistive technology. Set to
   * `false` when the line marks a real boundary between groups of content.
   */
  decorative?: boolean | undefined
}

defineOptions({ name: 'SoraSeparator' })

const { orientation = 'horizontal', decorative = true } = defineProps<SoraSeparatorProps>()

defineSlots<{
  /** Optional text in the middle of a horizontal separator. */
  default?(): unknown
}>()
</script>

<template>
  <div
    class="sora-separator"
    :data-orientation="orientation"
    :data-labelled="$slots.default ? '' : undefined"
    :role="decorative ? 'none' : 'separator'"
    :aria-orientation="decorative ? undefined : orientation"
  >
    <span v-if="$slots.default" class="sora-separator__label"><slot /></span>
  </div>
</template>
