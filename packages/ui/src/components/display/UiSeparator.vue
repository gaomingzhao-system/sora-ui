<script setup lang="ts" vapor>
import type { HTMLAttributes } from 'vue'
import type { UiOrientation } from '../../types/common.ts'

export interface UiSeparatorProps extends /* @vue-ignore */ HTMLAttributes {
  orientation?: UiOrientation | undefined
  /**
   * Decorative separators are hidden from assistive technology. Set to
   * `false` when the line marks a real boundary between groups of content.
   */
  decorative?: boolean | undefined
}

defineOptions({ name: 'UiSeparator' })

const { orientation = 'horizontal', decorative = true } = defineProps<UiSeparatorProps>()

defineSlots<{
  /** Optional text in the middle of a horizontal separator. */
  default?(): unknown
}>()
</script>

<template>
  <div
    class="vui-separator"
    :data-orientation="orientation"
    :data-labelled="$slots.default ? '' : undefined"
    :role="decorative ? 'none' : 'separator'"
    :aria-orientation="decorative ? undefined : orientation"
  >
    <span v-if="$slots.default" class="vui-separator__label"><slot /></span>
  </div>
</template>
