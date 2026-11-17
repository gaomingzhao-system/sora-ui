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

// Two possible roots (a rule or a labelled container): attributes are bound explicitly.
defineOptions({ name: 'SoraSeparator', inheritAttrs: false })

const { orientation = 'horizontal', decorative = true } = defineProps<SoraSeparatorProps>()

defineSlots<{
  /** Optional text in the middle of a horizontal separator. */
  default?(): unknown
}>()
</script>

<template>
  <!-- A plain rule is the native <hr> (implicit separator role); a labelled one needs a container. -->
  <hr
    v-if="!$slots.default"
    v-bind="$attrs"
    class="sora-separator"
    :data-orientation="orientation"
    :role="decorative ? 'none' : undefined"
    :aria-orientation="decorative || orientation === 'horizontal' ? undefined : orientation"
  />
  <div
    v-else
    v-bind="$attrs"
    class="sora-separator"
    data-labelled
    :data-orientation="orientation"
    :role="decorative ? 'none' : 'separator'"
    :aria-orientation="decorative || orientation === 'horizontal' ? undefined : orientation"
  >
    <span class="sora-separator__label"><slot /></span>
  </div>
</template>
