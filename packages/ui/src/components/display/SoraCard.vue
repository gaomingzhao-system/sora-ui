<script setup lang="ts" vapor>
import { computed, type HTMLAttributes } from 'vue'
import { useSoraDefaults } from '../../composables/use-sora-config.ts'
import { useSoraId } from '../../internal/ids.ts'
import type { SoraPadding, SoraSurfaceVariant } from '../../types/common.ts'

export interface SoraCardProps extends /* @vue-ignore */ HTMLAttributes {
  variant?: SoraSurfaceVariant | undefined
  padding?: SoraPadding | undefined
  /** Heading text. Use the `header` slot for richer content. */
  title?: string | undefined
  /** Supporting text under the title. */
  description?: string | undefined
  /** Heading level of `title`. Pick the level that fits the page outline. */
  headingLevel?: 2 | 3 | 4 | 5 | 6 | undefined
  /** Root element, e.g. `section` or `article` for a landmark-worthy card. */
  as?: string | undefined
}

defineOptions({ name: 'SoraCard' })

const { variant, padding, title, description, headingLevel = 3, as = 'div' } = defineProps<SoraCardProps>()

defineSlots<{
  /** Card body. */
  default?(): unknown
  /** Replaces the `title`/`description` heading. */
  header?(): unknown
  /** Controls aligned to the end of the header row. */
  actions?(): unknown
  /** Footer row, typically buttons. */
  footer?(): unknown
}>()

const defaults = useSoraDefaults('card')
const resolvedVariant = computed(() => variant ?? defaults().variant)
const resolvedPadding = computed(() => padding ?? defaults().padding)
const titleId = `${useSoraId()}-title`
</script>

<template>
  <component
    :is="as"
    class="sora-card"
    :data-variant="resolvedVariant"
    :data-padding="resolvedPadding"
    :aria-labelledby="title && as !== 'div' ? titleId : undefined"
  >
    <div v-if="$slots.header || $slots.actions || title || description" class="sora-card__header">
      <div class="sora-card__heading">
        <slot name="header">
          <component :is="`h${headingLevel}`" v-if="title" :id="titleId" class="sora-card__title">{{
            title
          }}</component>
          <p v-if="description" class="sora-card__description">{{ description }}</p>
        </slot>
      </div>
      <div v-if="$slots.actions" class="sora-card__actions"><slot name="actions" /></div>
    </div>
    <div v-if="$slots.default" class="sora-card__body"><slot /></div>
    <div v-if="$slots.footer" class="sora-card__footer"><slot name="footer" /></div>
  </component>
</template>
