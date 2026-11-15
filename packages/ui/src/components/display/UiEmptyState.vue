<script setup lang="ts" vapor>
import type { HTMLAttributes } from 'vue'
import { iconInbox } from '../../internal/icons.ts'
import type { UiIconDefinition, UiSize } from '../../types/common.ts'
import UiIcon from '../foundation/UiIcon.vue'

export interface UiEmptyStateProps extends /* @vue-ignore */ HTMLAttributes {
  /** Short statement of what is empty. */
  title: string
  /** What the person can do next. */
  description?: string | undefined
  /** Decorative glyph. Pass `null` to render none. */
  icon?: UiIconDefinition | null | undefined
  headingLevel?: 2 | 3 | 4 | 5 | 6 | undefined
  size?: UiSize | undefined
}

defineOptions({ name: 'UiEmptyState' })

const {
  title,
  description,
  icon = iconInbox,
  headingLevel = 3,
  size = 'md',
} = defineProps<UiEmptyStateProps>()

defineSlots<{
  /** Replaces `description`. */
  default?(): unknown
  /** Replaces the glyph. */
  icon?(): unknown
  /** Primary and secondary actions. */
  actions?(): unknown
}>()
</script>

<template>
  <div class="vui-empty-state" :data-size="size">
    <div v-if="$slots.icon || icon" class="vui-empty-state__icon" aria-hidden="true">
      <slot name="icon"><UiIcon v-if="icon" :icon="icon" /></slot>
    </div>
    <component :is="`h${headingLevel}`" class="vui-empty-state__title">{{ title }}</component>
    <div v-if="$slots.default || description" class="vui-empty-state__description">
      <slot>{{ description }}</slot>
    </div>
    <div v-if="$slots.actions" class="vui-empty-state__actions"><slot name="actions" /></div>
  </div>
</template>
