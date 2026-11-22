<script setup lang="ts" vapor>
import { computed, type HTMLAttributes } from 'vue'
import { useSoraLocale } from '../../composables/use-sora-locale.ts'
import { iconChevronLeft, iconChevronRight } from '../../internal/icons.ts'
import type { SoraSize } from '../../types/common.ts'
import SoraIcon from '../foundation/SoraIcon.vue'

export interface SoraPaginationProps extends /* @vue-ignore */ HTMLAttributes {
  /** Number of pages. Alternatively pass `total` and `pageSize`. */
  pageCount?: number | undefined
  /** Number of items across all pages. */
  total?: number | undefined
  /** Items per page, used with `total`. */
  pageSize?: number | undefined
  /** Page buttons shown on each side of the current page. */
  siblings?: number | undefined
  /** Page buttons always shown at the start and at the end. */
  boundaries?: number | undefined
  /** Accessible name of the navigation landmark. */
  label?: string | undefined
  size?: SoraSize | undefined
  disabled?: boolean | undefined
}

defineOptions({ name: 'SoraPagination' })

const {
  pageCount,
  total,
  pageSize = 10,
  siblings = 1,
  boundaries = 1,
  label,
  size = 'md',
  disabled = false,
} = defineProps<SoraPaginationProps>()

/** Current page, starting at 1. */
const page = defineModel<number>('page', { required: true })

const { t, formatNumber } = useSoraLocale()

const count = computed(() => {
  const pages = pageCount ?? (total === undefined ? 1 : Math.ceil(total / Math.max(1, pageSize)))
  return Math.max(1, Math.floor(pages))
})
const current = computed(() => Math.min(Math.max(1, Math.floor(page.value)), count.value))

/** Page numbers with `null` marking a gap. */
const entries = computed<(number | null)[]>(() => {
  const last = count.value
  const wanted = new Set<number>()
  for (let index = 1; index <= Math.min(boundaries, last); index++) wanted.add(index)
  for (let index = Math.max(1, last - boundaries + 1); index <= last; index++) wanted.add(index)
  for (let index = current.value - siblings; index <= current.value + siblings; index++) {
    if (index >= 1 && index <= last) wanted.add(index)
  }
  const sorted = [...wanted].toSorted((a, b) => a - b)
  const result: (number | null)[] = []
  let previous = 0
  for (const value of sorted) {
    // A gap of exactly one page is shown as that page, not as an ellipsis.
    if (value - previous === 2) result.push(previous + 1)
    else if (value - previous > 2) result.push(null)
    result.push(value)
    previous = value
  }
  return result
})

const go = (target: number): void => {
  if (disabled) return
  const next = Math.min(Math.max(1, target), count.value)
  if (next !== page.value) page.value = next
}
</script>

<template>
  <nav class="sora-pagination" :aria-label="label ?? t('pagination.label')" :data-size="size">
    <ul class="sora-pagination__list">
      <li>
        <button
          type="button"
          class="sora-pagination__button"
          :disabled="disabled || current <= 1"
          :aria-label="t('pagination.previous')"
          @click="go(current - 1)"
        >
          <SoraIcon :icon="iconChevronLeft" />
        </button>
      </li>
      <li v-for="(entry, index) in entries" :key="entry ?? `gap-${index}`" class="sora-pagination__page">
        <span v-if="entry === null" class="sora-pagination__gap" aria-hidden="true">…</span>
        <button
          v-else
          type="button"
          class="sora-pagination__button"
          :disabled="disabled"
          :aria-current="entry === current ? 'page' : undefined"
          :aria-label="
            entry === current
              ? t('pagination.current', { page: formatNumber(entry) })
              : t('pagination.page', { page: formatNumber(entry) })
          "
          @click="go(entry)"
        >
          {{ formatNumber(entry) }}
        </button>
      </li>
      <!-- Shown instead of the page buttons when the container is narrow. -->
      <li class="sora-pagination__status">
        {{ t('pagination.status', { page: formatNumber(current), total: formatNumber(count) }) }}
      </li>
      <li>
        <button
          type="button"
          class="sora-pagination__button"
          :disabled="disabled || current >= count"
          :aria-label="t('pagination.next')"
          @click="go(current + 1)"
        >
          <SoraIcon :icon="iconChevronRight" />
        </button>
      </li>
    </ul>
  </nav>
</template>
