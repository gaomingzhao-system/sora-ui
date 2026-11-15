<script setup lang="ts" vapor>
import { computed } from 'vue'
import type { HTMLAttributes } from 'vue'
import { useUiDefaults } from '../../composables/use-ui-config.ts'
import { useUiId } from '../../internal/ids.ts'
import type { UiPadding, UiSurfaceVariant } from '../../types/common.ts'

export interface UiCardProps extends /* @vue-ignore */ HTMLAttributes {
  variant?: UiSurfaceVariant | undefined
  padding?: UiPadding | undefined
  /** Heading text. Use the `header` slot for richer content. */
  title?: string | undefined
  /** Supporting text under the title. */
  description?: string | undefined
  /** Heading level of `title`. Pick the level that fits the page outline. */
  headingLevel?: 2 | 3 | 4 | 5 | 6 | undefined
  /** Root element, e.g. `section` or `article` for a landmark-worthy card. */
  as?: string | undefined
}

defineOptions({ name: 'UiCard' })

const { variant, padding, title, description, headingLevel = 3, as = 'div' } = defineProps<UiCardProps>()

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

const defaults = useUiDefaults('card')
const resolvedVariant = computed(() => variant ?? defaults().variant)
const resolvedPadding = computed(() => padding ?? defaults().padding)
const titleId = `${useUiId()}-title`
</script>

<template>
  <component
    :is="as"
    class="vui-card"
    :data-variant="resolvedVariant"
    :data-padding="resolvedPadding"
    :aria-labelledby="title && as !== 'div' ? titleId : undefined"
  >
    <div v-if="$slots.header || $slots.actions || title || description" class="vui-card__header">
      <div class="vui-card__heading">
        <slot name="header">
          <component :is="`h${headingLevel}`" v-if="title" :id="titleId" class="vui-card__title">{{
            title
          }}</component>
          <p v-if="description" class="vui-card__description">{{ description }}</p>
        </slot>
      </div>
      <div v-if="$slots.actions" class="vui-card__actions"><slot name="actions" /></div>
    </div>
    <div v-if="$slots.default" class="vui-card__body"><slot /></div>
    <div v-if="$slots.footer" class="vui-card__footer"><slot name="footer" /></div>
  </component>
</template>
