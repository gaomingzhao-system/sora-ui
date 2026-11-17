<script setup lang="ts" vapor generic="T extends SoraBreadcrumbItem">
import type { HTMLAttributes } from 'vue'
import { useSoraLocale } from '../../composables/use-sora-locale.ts'
import { iconChevronRight } from '../../internal/icons.ts'
import SoraIcon from '../foundation/SoraIcon.vue'

export interface SoraBreadcrumbItem {
  label: string
  /** Destination. The last item is the current page and is never a link. */
  href?: string | undefined
}

export interface SoraBreadcrumbsProps<TItem extends SoraBreadcrumbItem = SoraBreadcrumbItem>
  extends /* @vue-ignore */ HTMLAttributes {
  /** Trail from the root to the current page. */
  items: readonly TItem[]
  /** Accessible name of the navigation landmark. */
  label?: string | undefined
}

defineOptions({ name: 'SoraBreadcrumbs' })

const { items, label } = defineProps<SoraBreadcrumbsProps<T>>()

defineSlots<{
  /** Content of one crumb (the label by default). */
  item?(props: { item: T; current: boolean }): unknown
}>()

const { t } = useSoraLocale()
</script>

<template>
  <!-- Ordinary site navigation: a nav landmark with a list of links, not a menu. -->
  <nav class="sora-breadcrumbs" :aria-label="label ?? t('breadcrumbs.label')">
    <ol class="sora-breadcrumbs__list">
      <li v-for="(item, index) in items" :key="index" class="sora-breadcrumbs__item">
        <SoraIcon v-if="index > 0" :icon="iconChevronRight" class="sora-breadcrumbs__separator" />
        <a v-if="item.href && index < items.length - 1" class="sora-breadcrumbs__link" :href="item.href">
          <slot name="item" :item="item" :current="false">{{ item.label }}</slot>
        </a>
        <span
          v-else
          class="sora-breadcrumbs__text"
          :aria-current="index === items.length - 1 ? 'page' : undefined"
        >
          <slot name="item" :item="item" :current="index === items.length - 1">{{ item.label }}</slot>
        </span>
      </li>
    </ol>
  </nav>
</template>
