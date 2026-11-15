<script setup lang="ts" vapor generic="T extends UiBreadcrumbItem">
import type { HTMLAttributes } from 'vue'
import { useUiLocale } from '../../composables/use-ui-locale.ts'
import { iconChevronRight } from '../../internal/icons.ts'
import UiIcon from '../foundation/UiIcon.vue'

export interface UiBreadcrumbItem {
  label: string
  /** Destination. The last item is the current page and is never a link. */
  href?: string | undefined
}

export interface UiBreadcrumbsProps<TItem extends UiBreadcrumbItem = UiBreadcrumbItem>
  extends /* @vue-ignore */ HTMLAttributes {
  /** Trail from the root to the current page. */
  items: readonly TItem[]
  /** Accessible name of the navigation landmark. */
  label?: string | undefined
}

defineOptions({ name: 'UiBreadcrumbs' })

const { items, label } = defineProps<UiBreadcrumbsProps<T>>()

defineSlots<{
  /** Content of one crumb (the label by default). */
  item?(props: { item: T; current: boolean }): unknown
}>()

const { t } = useUiLocale()
</script>

<template>
  <!-- Ordinary site navigation: a nav landmark with a list of links, not a menu. -->
  <nav class="vui-breadcrumbs" :aria-label="label ?? t('breadcrumbs.label')">
    <ol class="vui-breadcrumbs__list">
      <li v-for="(item, index) in items" :key="index" class="vui-breadcrumbs__item">
        <UiIcon v-if="index > 0" :icon="iconChevronRight" class="vui-breadcrumbs__separator" />
        <a v-if="item.href && index < items.length - 1" class="vui-breadcrumbs__link" :href="item.href">
          <slot name="item" :item="item" :current="false">{{ item.label }}</slot>
        </a>
        <span
          v-else
          class="vui-breadcrumbs__text"
          :aria-current="index === items.length - 1 ? 'page' : undefined"
        >
          <slot name="item" :item="item" :current="index === items.length - 1">{{ item.label }}</slot>
        </span>
      </li>
    </ol>
  </nav>
</template>
