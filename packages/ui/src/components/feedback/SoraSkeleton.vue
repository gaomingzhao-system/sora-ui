<script setup lang="ts" vapor>
import type { HTMLAttributes } from 'vue'
import { useSoraLocale } from '../../composables/use-sora-locale.ts'

export interface SoraSkeletonProps extends /* @vue-ignore */ HTMLAttributes {
  shape?: 'text' | 'rect' | 'circle' | undefined
  /** CSS inline size, e.g. `12rem` or `60%`. */
  width?: string | undefined
  /** CSS block size. Text skeletons default to one line. */
  height?: string | undefined
  /** Number of text lines (the last one is shorter). */
  lines?: number | undefined
  /**
   * Announce a loading status. By default skeletons are decorative; mark the
   * region being loaded with `aria-busy="true"` or announce once here.
   */
  announce?: boolean | undefined
}

defineOptions({ name: 'SoraSkeleton' })

const { shape = 'text', width, height, lines = 1, announce = false } = defineProps<SoraSkeletonProps>()
const { t } = useSoraLocale()
</script>

<template>
  <span
    class="sora-skeleton"
    :data-shape="shape"
    :role="announce ? 'status' : undefined"
    :aria-hidden="announce ? undefined : 'true'"
  >
    <span
      v-for="line in Math.max(1, shape === 'text' ? lines : 1)"
      :key="line"
      class="sora-skeleton__block"
      aria-hidden="true"
      :style="{ inlineSize: width, blockSize: height }"
    />
    <span v-if="announce" class="sora-sr-only">{{ t('skeleton.label') }}</span>
  </span>
</template>
