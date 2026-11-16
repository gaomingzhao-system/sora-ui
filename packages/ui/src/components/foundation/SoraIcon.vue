<script setup lang="ts" vapor>
import type { SVGAttributes } from 'vue'
import type { SoraIconDefinition, SoraSize } from '../../types/common.ts'

export interface SoraIconProps extends /* @vue-ignore */ SVGAttributes {
  /** Trusted path data, e.g. one of the `icon*` exports. */
  icon: SoraIconDefinition
  /** Accessible name. Omit for a decorative icon, which is hidden from assistive technology. */
  label?: string | undefined
  /** Fixed size. Omit to scale with the surrounding text (`1em`). */
  size?: SoraSize | undefined
}

defineOptions({ name: 'SoraIcon' })

const { icon, label, size } = defineProps<SoraIconProps>()
</script>

<template>
  <svg
    class="sora-icon"
    viewBox="0 0 24 24"
    focusable="false"
    :data-size="size"
    :data-filled="icon.filled ? '' : undefined"
    :data-directional="icon.directional ? '' : undefined"
    :role="label ? 'img' : undefined"
    :aria-label="label"
    :aria-hidden="label ? undefined : 'true'"
  >
    <path v-for="path in icon.paths" :key="path" :d="path" />
  </svg>
</template>
