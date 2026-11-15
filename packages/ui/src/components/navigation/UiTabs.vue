<script setup lang="ts" vapor generic="T extends UiTabItem">
import { computed, useTemplateRef } from 'vue'
import type { HTMLAttributes } from 'vue'
import { useUiDefaults } from '../../composables/use-ui-config.ts'
import { useRovingFocus } from '../../composables/use-roving-focus.ts'
import { useUiId } from '../../internal/ids.ts'
import type { UiIconDefinition, UiOrientation, UiSize } from '../../types/common.ts'
import UiIcon from '../foundation/UiIcon.vue'

export interface UiTabItem {
  value: string | number
  label: string
  disabled?: boolean | undefined
  icon?: UiIconDefinition | undefined
}

export interface UiTabsProps<TItem extends UiTabItem = UiTabItem> extends /* @vue-ignore */ HTMLAttributes {
  items: readonly TItem[]
  /** Accessible name of the tab list. */
  label?: string | undefined
  orientation?: UiOrientation | undefined
  /**
   * `automatic` selects a tab as soon as it receives focus; `manual` waits
   * for Enter or Space (use it when showing a panel is expensive).
   */
  activation?: 'automatic' | 'manual' | undefined
  variant?: 'underline' | 'pill' | undefined
  size?: UiSize | undefined
  /** Stretch the tabs across the available width. */
  fitted?: boolean | undefined
}

defineOptions({ name: 'UiTabs' })

const {
  items,
  label,
  orientation = 'horizontal',
  activation = 'automatic',
  variant = 'underline',
  size,
  fitted = false,
} = defineProps<UiTabsProps<T>>()

/** `value` of the selected tab. */
const model = defineModel<T['value']>({ required: true })

defineSlots<{
  /** Content of the selected tab's panel. */
  content?(props: { item: T }): unknown
  /** Content of one tab (the label by default). */
  tab?(props: { item: T; selected: boolean }): unknown
}>()

const defaults = useUiDefaults('tabs')
const resolvedSize = computed(() => size ?? defaults().size)
const id = useUiId()
const panelId = `${id}-panel`
const tabId = (index: number): string => `${id}-tab-${index}`

const selectedIndex = computed(() => items.findIndex((item) => item.value === model.value))
const selectedItem = computed(() => items[selectedIndex.value])
// Exactly one tab is in the page Tab sequence: the selected one, else the first enabled one.
const tabStop = computed(() =>
  selectedIndex.value >= 0 ? selectedIndex.value : items.findIndex((item) => !item.disabled),
)

const list = useTemplateRef<HTMLElement>('list')
const roving = useRovingFocus({
  container: () => list.value,
  selector: '[role="tab"]',
  orientation: () => orientation,
})

function select(item: T): void {
  if (!item.disabled) model.value = item.value
}

function onKeydown(event: KeyboardEvent): void {
  const focused = roving.onKeydown(event)
  if (!focused || activation !== 'automatic') return
  const item = items[roving.items().indexOf(focused)]
  if (item) select(item)
}
</script>

<template>
  <div class="vui-tabs" :data-orientation="orientation" :data-variant="variant" :data-size="resolvedSize">
    <div
      ref="list"
      class="vui-tabs__list"
      role="tablist"
      :aria-label="label"
      :aria-orientation="orientation"
      :data-fitted="fitted ? '' : undefined"
      @keydown="onKeydown"
    >
      <button
        v-for="(item, index) in items"
        :id="tabId(index)"
        :key="item.value"
        class="vui-tabs__tab"
        type="button"
        role="tab"
        :disabled="item.disabled"
        :tabindex="index === tabStop ? 0 : -1"
        :aria-selected="index === selectedIndex ? 'true' : 'false'"
        :aria-controls="index === selectedIndex ? panelId : undefined"
        @click="select(item)"
      >
        <UiIcon v-if="item.icon" :icon="item.icon" />
        <slot name="tab" :item="item" :selected="index === selectedIndex">{{ item.label }}</slot>
      </button>
    </div>
    <div
      v-if="selectedItem"
      :id="panelId"
      :key="selectedItem.value"
      class="vui-tabs__panel"
      role="tabpanel"
      tabindex="0"
      :aria-labelledby="tabId(selectedIndex)"
    >
      <slot name="content" :item="selectedItem" />
    </div>
  </div>
</template>
