<script setup lang="ts" vapor>
import type { HTMLAttributes } from 'vue'
import { iconInbox } from '../../internal/icons.ts'
import type { SoraIconDefinition, SoraSize } from '../../types/common.ts'
import SoraIcon from '../foundation/SoraIcon.vue'

export interface SoraEmptyStateProps extends /* @vue-ignore */ HTMLAttributes {
  /** Short statement of what is empty. */
  title: string
  /** What the person can do next. */
  description?: string | undefined
  /** Decorative glyph. Pass `null` to render none. */
  icon?: SoraIconDefinition | null | undefined
  headingLevel?: 2 | 3 | 4 | 5 | 6 | undefined
  size?: SoraSize | undefined
}

defineOptions({ name: 'SoraEmptyState' })

const {
  title,
  description,
  icon = iconInbox,
  headingLevel = 3,
  size = 'md',
} = defineProps<SoraEmptyStateProps>()

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
  <div class="sora-empty-state" :data-size="size">
    <div v-if="$slots.icon || icon" class="sora-empty-state__icon" aria-hidden="true">
      <slot name="icon"><SoraIcon v-if="icon" :icon="icon" /></slot>
    </div>
    <component :is="`h${headingLevel}`" class="sora-empty-state__title">{{ title }}</component>
    <div v-if="$slots.default || description" class="sora-empty-state__description">
      <slot>{{ description }}</slot>
    </div>
    <div v-if="$slots.actions" class="sora-empty-state__actions"><slot name="actions" /></div>
  </div>
</template>
