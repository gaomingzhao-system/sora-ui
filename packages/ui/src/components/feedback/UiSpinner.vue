<script setup lang="ts" vapor>
import type { HTMLAttributes } from 'vue'
import { useUiLocale } from '../../composables/use-ui-locale.ts'
import type { UiSize } from '../../types/common.ts'

export interface UiSpinnerProps extends /* @vue-ignore */ HTMLAttributes {
  size?: UiSize | undefined
  /** Accessible status text. Defaults to the translated "Loading". */
  label?: string | undefined
  /**
   * Hide from assistive technology. Use when another element already
   * reports the busy state (for example a button with `aria-busy`).
   */
  decorative?: boolean | undefined
}

defineOptions({ name: 'UiSpinner' })

const { size = 'md', label, decorative = false } = defineProps<UiSpinnerProps>()
const { t } = useUiLocale()
</script>

<template>
  <span
    class="vui-spinner"
    :data-size="size"
    :role="decorative ? undefined : 'status'"
    :aria-hidden="decorative ? 'true' : undefined"
  >
    <span class="vui-spinner__ring" aria-hidden="true" />
    <span v-if="!decorative" class="vui-sr-only">{{ label ?? t('spinner.label') }}</span>
  </span>
</template>
