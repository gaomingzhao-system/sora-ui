<script setup lang="ts" vapor generic="T extends UiAccordionItem">
import { useTemplateRef } from 'vue'
import type { HTMLAttributes } from 'vue'
import { useRovingFocus } from '../../composables/use-roving-focus.ts'
import { iconChevronDown } from '../../internal/icons.ts'
import { useUiId } from '../../internal/ids.ts'
import type { UiSize } from '../../types/common.ts'
import UiIcon from '../foundation/UiIcon.vue'

export interface UiAccordionItem {
  value: string | number
  label: string
  /** Plain-text panel content. Use the `content` slot for anything richer. */
  content?: string | undefined
  disabled?: boolean | undefined
}

export interface UiAccordionProps<TItem extends UiAccordionItem = UiAccordionItem>
  extends /* @vue-ignore */ HTMLAttributes {
  items: readonly TItem[]
  /** Allow several panels to be open at once. */
  multiple?: boolean | undefined
  /** In single mode, allow the open panel to be closed again. */
  collapsible?: boolean | undefined
  /** Heading level of the item headers. Pick the level that fits the page outline. */
  headingLevel?: 2 | 3 | 4 | 5 | 6 | undefined
  size?: UiSize | undefined
}

defineOptions({ name: 'UiAccordion' })

const {
  items,
  multiple = false,
  collapsible = true,
  headingLevel = 3,
  size = 'md',
} = defineProps<UiAccordionProps<T>>()

/** `value`s of the open items (at most one unless `multiple`). */
const model = defineModel<T['value'][]>({ required: true })

defineSlots<{
  /** Header content of one item (the label by default). */
  title?(props: { item: T; open: boolean }): unknown
  /** Panel content of one item. */
  content?(props: { item: T; open: boolean }): unknown
}>()

const id = useUiId()
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
  selector: ':scope > .vui-accordion__item > .vui-accordion__heading > .vui-accordion__trigger',
  orientation: () => 'vertical',
})
</script>

<template>
  <div ref="root" class="vui-accordion" :data-size="size" @keydown="roving.onKeydown">
    <div
      v-for="(item, index) in items"
      :key="item.value"
      class="vui-accordion__item"
      :data-open="isOpen(item) ? '' : undefined"
    >
      <component :is="`h${headingLevel}`" class="vui-accordion__heading">
        <button
          :id="headerId(index)"
          type="button"
          class="vui-accordion__trigger"
          :disabled="item.disabled"
          :aria-expanded="isOpen(item) ? 'true' : 'false'"
          :aria-controls="panelId(index)"
          @click="toggle(item)"
        >
          <span class="vui-accordion__label">
            <slot name="title" :item="item" :open="isOpen(item)">{{ item.label }}</slot>
          </span>
          <UiIcon :icon="iconChevronDown" class="vui-accordion__chevron" />
        </button>
      </component>
      <!-- Closed panels are `inert`: out of the tab order and the accessibility tree, and still animatable. -->
      <div
        :id="panelId(index)"
        class="vui-accordion__panel"
        :role="items.length <= 6 ? 'region' : undefined"
        :aria-labelledby="headerId(index)"
        :inert="!isOpen(item)"
      >
        <div class="vui-accordion__content">
          <slot name="content" :item="item" :open="isOpen(item)">{{ item.content }}</slot>
        </div>
      </div>
    </div>
  </div>
</template>
