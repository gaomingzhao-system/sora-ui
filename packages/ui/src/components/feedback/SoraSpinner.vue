<script setup lang="ts" vapor>
import type { HTMLAttributes } from 'vue'
import { useSoraLocale } from '../../composables/use-sora-locale.ts'
import type { SoraSize } from '../../types/common.ts'

export interface SoraSpinnerProps extends /* @vue-ignore */ HTMLAttributes {
  size?: SoraSize | undefined
  /** Accessible status text. Defaults to the translated "Loading". */
  label?: string | undefined
  /**
   * Hide from assistive technology. Use when another element already
   * reports the busy state (for example a button with `aria-busy`).
   */
  decorative?: boolean | undefined
}

defineOptions({ name: 'SoraSpinner' })

const { size = 'md', label, decorative = false } = defineProps<SoraSpinnerProps>()
const { t } = useSoraLocale()
</script>

<template>
  <span
    class="sora-spinner"
    :data-size="size"
    :role="decorative ? undefined : 'status'"
    :aria-hidden="decorative ? 'true' : undefined"
  >
    <span class="sora-spinner__ring" aria-hidden="true" />
    <span v-if="!decorative" class="sora-sr-only">{{ label ?? t('spinner.label') }}</span>
  </span>
</template>
