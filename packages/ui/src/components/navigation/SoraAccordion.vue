<script setup lang="ts" vapor generic="T extends SoraAccordionItem">
import { useTemplateRef } from 'vue'
import type { HTMLAttributes } from 'vue'
import { useRovingFocus } from '../../composables/use-roving-focus.ts'
import { iconChevronDown } from '../../internal/icons.ts'
import { useSoraId } from '../../internal/ids.ts'
import type { SoraSize } from '../../types/common.ts'
import SoraIcon from '../foundation/SoraIcon.vue'

export interface SoraAccordionItem {
  value: string | number
  label: string
  /** Plain-text panel content. Use the `content` slot for anything richer. */
  content?: string | undefined
  disabled?: boolean | undefined
}

export interface SoraAccordionProps<TItem extends SoraAccordionItem = SoraAccordionItem>
  extends /* @vue-ignore */ HTMLAttributes {
  items: readonly TItem[]
  /** Allow several panels to be open at once. */
  multiple?: boolean | undefined
  /** In single mode, allow the open panel to be closed again. */
  collapsible?: boolean | undefined
  /** Heading level of the item headers. Pick the level that fits the page outline. */
  headingLevel?: 2 | 3 | 4 | 5 | 6 | undefined
  size?: SoraSize | undefined
}

defineOptions({ name: 'SoraAccordion' })

const {
  items,
  multiple = false,
  collapsible = true,
  headingLevel = 3,
  size = 'md',
} = defineProps<SoraAccordionProps<T>>()

/** `value`s of the open items (at most one unless `multiple`). */
const model = defineModel<T['value'][]>({ required: true })

defineSlots<{
  /** Header content of one item (the label by default). */
  title?(props: { item: T; open: boolean }): unknown
  /** Panel content of one item. */
  content?(props: { item: T; open: boolean }): unknown
}>()

const id = useSoraId()
const headerId = (index: number): string => `${id}-header-${index}`
const panelId = (index: number): string => `${id}-panel-${index}`

const isOpen = (item: T): boolean => model.value.includes(item.value)

function toggle(item: T): void {
  if (item.disabled) return
  if (isOpen(item)) {
    if (multiple || collapsible) model.value = model.value.filter((value) => value !== item.value)
  } else {
    model.value = multiple ? [...model.value, item.value] : [item.value]
  }
}

// Headers are ordinary buttons (Enter/Space toggle natively); arrows, Home and
// End additionally move between headers.
const root = useTemplateRef<HTMLElement>('root')
const roving = useRovingFocus({
  container: () => root.value,
  selector: ':scope > .sora-accordion__item > .sora-accordion__heading > .sora-accordion__trigger',
  orientation: () => 'vertical',
})
</script>

<template>
  <div ref="root" class="sora-accordion" :data-size="size" @keydown="roving.onKeydown">
    <div
      v-for="(item, index) in items"
      :key="item.value"
      class="sora-accordion__item"
      :data-open="isOpen(item) ? '' : undefined"
    >
      <component :is="`h${headingLevel}`" class="sora-accordion__heading">
        <button
          :id="headerId(index)"
          type="button"
          class="sora-accordion__trigger"
          :disabled="item.disabled"
          :aria-expanded="isOpen(item) ? 'true' : 'false'"
          :aria-controls="panelId(index)"
          @click="toggle(item)"
        >
          <span class="sora-accordion__label">
            <slot name="title" :item="item" :open="isOpen(item)">{{ item.label }}</slot>
          </span>
          <SoraIcon :icon="iconChevronDown" class="sora-accordion__chevron" />
        </button>
      </component>
      <!-- Closed panels are `inert`: out of the tab order and the accessibility tree, and still animatable. -->
      <div
        :id="panelId(index)"
        class="sora-accordion__panel"
        :role="items.length <= 6 ? 'region' : undefined"
        :aria-labelledby="headerId(index)"
        :inert="!isOpen(item)"
      >
        <div class="sora-accordion__content">
          <slot name="content" :item="item" :open="isOpen(item)">{{ item.content }}</slot>
        </div>
      </div>
    </div>
  </div>
</template>
