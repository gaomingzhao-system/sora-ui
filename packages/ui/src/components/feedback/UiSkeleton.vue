<script setup lang="ts" vapor>
import type { HTMLAttributes } from 'vue'
import { useUiLocale } from '../../composables/use-ui-locale.ts'

export interface UiSkeletonProps extends /* @vue-ignore */ HTMLAttributes {
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

defineOptions({ name: 'UiSkeleton' })

const { shape = 'text', width, height, lines = 1, announce = false } = defineProps<UiSkeletonProps>()
const { t } = useUiLocale()
</script>

<template>
  <span
    class="vui-skeleton"
    :data-shape="shape"
    :role="announce ? 'status' : undefined"
    :aria-hidden="announce ? undefined : 'true'"
  >
    <span
      v-for="line in Math.max(1, shape === 'text' ? lines : 1)"
      :key="line"
      class="vui-skeleton__block"
      aria-hidden="true"
      :style="{ inlineSize: width, blockSize: height }"
    />
    <span v-if="announce" class="vui-sr-only">{{ t('skeleton.label') }}</span>
  </span>
</template>
