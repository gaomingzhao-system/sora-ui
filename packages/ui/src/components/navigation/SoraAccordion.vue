<script setup lang="ts" vapor generic="T extends SoraAccordionItem">
import { computed, useTemplateRef } from 'vue'
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
  size?: SoraSize | undefined
}

defineOptions({ name: 'SoraAccordion' })

const { items, multiple = false, collapsible = true, size = 'md' } = defineProps<SoraAccordionProps<T>>()

/** `value`s of the open items (at most one unless `multiple`). */
const model = defineModel<T['value'][]>({ required: true })

defineSlots<{
  /** Summary content of one item (the label by default). */
  title?(props: { item: T; open: boolean }): unknown
  /** Panel content of one item. */
  content?(props: { item: T; open: boolean }): unknown
}>()

// Items of one single-mode accordion share a `name`: the browser itself keeps
// at most one of them open (exclusive accordion).
const groupName = `${useSoraId()}-accordion`
// One lookup per item and render instead of scanning the model array.
const openValues = computed(() => new Set<T['value']>(model.value))

const root = useTemplateRef<HTMLElement>('root')
const roving = useRovingFocus({
  container: () => root.value,
  selector: ':scope > .sora-accordion__item > .sora-accordion__trigger',
  orientation: () => 'vertical',
})

function sameValues(a: readonly T['value'][], b: readonly T['value'][]): boolean {
  return a.length === b.length && a.every((value, index) => value === b[index])
}

/**
 * The native element changed (a click, Enter or Space on the summary, the
 * exclusivity of a `name` group, or find-in-page revealing a match): read the
 * open state back from the elements, in item order.
 */
function onToggle(): void {
  const elements = root.value?.querySelectorAll<HTMLDetailsElement>(':scope > .sora-accordion__item')
  if (!elements) return
  const next: T['value'][] = []
  for (const [index, element] of elements.entries()) {
    const item = items[index]
    if (item && element.open) next.push(item.value)
  }
  if (!sameValues(next, model.value)) model.value = next
}

// A disabled item never toggles; in single, non-collapsible mode the open item stays open.
function onSummaryClick(item: T, event: MouseEvent): void {
  if (item.disabled || (!multiple && !collapsible && openValues.value.has(item.value))) event.preventDefault()
}
</script>

<template>
  <!--
    Native disclosure: <details> and <summary> supply the button semantics,
    the expanded state, Enter/Space, and find-in-page that opens the item
    holding a match. Arrow keys, Home and End move between the summaries.
  -->
  <div ref="root" class="sora-accordion" :data-size="size" @keydown="roving.onKeydown">
    <details
      v-for="item in items"
      :key="item.value"
      class="sora-accordion__item"
      :name="multiple ? undefined : groupName"
      :open="openValues.has(item.value)"
      :data-disabled="item.disabled ? '' : undefined"
      @toggle="onToggle"
    >
      <summary
        class="sora-accordion__trigger"
        :tabindex="item.disabled ? -1 : undefined"
        :aria-disabled="item.disabled ? 'true' : undefined"
        @click="onSummaryClick(item, $event)"
      >
        <span class="sora-accordion__label">
          <slot name="title" :item="item" :open="openValues.has(item.value)">{{ item.label }}</slot>
        </span>
        <SoraIcon :icon="iconChevronDown" class="sora-accordion__chevron" />
      </summary>
      <div class="sora-accordion__content">
        <slot name="content" :item="item" :open="openValues.has(item.value)">{{ item.content }}</slot>
      </div>
    </details>
  </div>
</template>
