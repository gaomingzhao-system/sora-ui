<script setup lang="ts" vapor>
import { computed } from 'vue'
import type { HTMLAttributes } from 'vue'
import { useSoraLocale } from '../../composables/use-sora-locale.ts'
import { useSoraId } from '../../internal/ids.ts'
import type { SoraColor, SoraSize } from '../../types/common.ts'

export interface SoraProgressProps extends /* @vue-ignore */ HTMLAttributes {
  /** Completed amount. `null`/omitted renders an indeterminate bar. */
  value?: number | null | undefined
  max?: number | undefined
  /** Visible label. Without it the bar is named by the translated "Progress". */
  label?: string | undefined
  /** Show the percentage next to the label. */
  showValue?: boolean | undefined
  size?: SoraSize | undefined
  color?: SoraColor | undefined
}

defineOptions({ name: 'SoraProgress' })

const {
  value,
  max = 100,
  label,
  showValue = false,
  size = 'md',
  color = 'primary',
} = defineProps<SoraProgressProps>()

const { t, formatNumber } = useSoraLocale()
const id = useSoraId()
const labelId = `${id}-label`

const determinate = computed(() => typeof value === 'number' && Number.isFinite(value))
const clamped = computed(() => Math.min(Math.max(value ?? 0, 0), max))
const percent = computed(() => (max > 0 ? clamped.value / max : 0))
const valueText = computed(() => formatNumber(percent.value, { style: 'percent', maximumFractionDigits: 0 }))
</script>

<template>
  <div class="sora-progress" :data-size="size" :data-color="color">
    <div v-if="label || (showValue && determinate)" class="sora-progress__header">
      <span v-if="label" :id="labelId" class="sora-progress__label">{{ label }}</span>
      <span v-if="showValue && determinate" class="sora-progress__value" aria-hidden="true">{{
        valueText
      }}</span>
    </div>
    <!-- Native <progress>: determinate when `value` is set, indeterminate when the attribute is absent. -->
    <progress
      class="sora-progress__bar"
      :value="determinate ? clamped : undefined"
      :max="max"
      :aria-labelledby="label ? labelId : undefined"
      :aria-label="label ? undefined : t('progress.label')"
      :aria-valuetext="determinate ? valueText : undefined"
    />
  </div>
</template>
