<script setup lang="ts" vapor generic="T extends SoraTabItem">
import { computed, onBeforeUnmount, onMounted, useTemplateRef, watch } from 'vue'
import type { HTMLAttributes } from 'vue'
import { useSoraDefaults } from '../../composables/use-sora-config.ts'
import { useRovingFocus } from '../../composables/use-roving-focus.ts'
import { useSoraId } from '../../internal/ids.ts'
import type { SoraIconDefinition, SoraOrientation, SoraSize } from '../../types/common.ts'
import SoraIcon from '../foundation/SoraIcon.vue'

export interface SoraTabItem {
  value: string | number
  label: string
  disabled?: boolean | undefined
  icon?: SoraIconDefinition | undefined
}

export interface SoraTabsProps<TItem extends SoraTabItem = SoraTabItem>
  extends /* @vue-ignore */ HTMLAttributes {
  items: readonly TItem[]
  /** Accessible name of the tab list. */
  label?: string | undefined
  orientation?: SoraOrientation | undefined
  /**
   * `automatic` selects a tab as soon as it receives focus; `manual` waits
   * for Enter or Space (use it when showing a panel is expensive).
   */
  activation?: 'automatic' | 'manual' | undefined
  variant?: 'underline' | 'pill' | undefined
  size?: SoraSize | undefined
  /** Stretch the tabs across the available width. */
  fitted?: boolean | undefined
}

defineOptions({ name: 'SoraTabs' })

const {
  items,
  label,
  orientation = 'horizontal',
  activation = 'automatic',
  variant = 'underline',
  size,
  fitted = false,
} = defineProps<SoraTabsProps<T>>()

/** `value` of the selected tab. */
const model = defineModel<T['value']>({ required: true })

defineSlots<{
  /** Content of the selected tab's panel. */
  content?(props: { item: T }): unknown
  /** Content of one tab (the label by default). */
  tab?(props: { item: T; selected: boolean }): unknown
}>()

const defaults = useSoraDefaults('tabs')
const resolvedSize = computed(() => size ?? defaults().size)
const id = useSoraId()
const panelId = `${id}-panel`
const tabId = (index: number): string => `${id}-tab-${index}`

const selectedIndex = computed(() => items.findIndex((item) => item.value === model.value))
const selectedItem = computed(() => items[selectedIndex.value])
// Exactly one tab is in the page Tab sequence: the selected one, else the first enabled one.
const tabStop = computed(() =>
  selectedIndex.value >= 0 ? selectedIndex.value : items.findIndex((item) => !item.disabled),
)

const list = useTemplateRef<HTMLElement>('list')
const indicator = useTemplateRef<HTMLElement>('indicator')

/**
 * One element marks the selection and glides from tab to tab, like the thumb
 * of a native segmented control. Its box is written straight to the element
 * (no reactive state): one layout read per selection change or resize.
 */
function placeIndicator(): void {
  const element = indicator.value
  const tab = list.value?.querySelectorAll<HTMLElement>('[role="tab"]')[selectedIndex.value]
  if (!element) return
  if (!tab) {
    element.hidden = true
    return
  }
  element.hidden = false
  element.style.setProperty('--_x', `${tab.offsetLeft}px`)
  element.style.setProperty('--_y', `${tab.offsetTop}px`)
  element.style.setProperty('--_w', `${tab.offsetWidth}px`)
  element.style.setProperty('--_h', `${tab.offsetHeight}px`)
}

let observer: ResizeObserver | undefined
onMounted(() => {
  placeIndicator()
  // Only animate from the second placement on, so the first paint does not slide in.
  requestAnimationFrame(() => indicator.value?.toggleAttribute('data-ready', true))
  if (list.value) {
    observer = new ResizeObserver(placeIndicator)
    observer.observe(list.value)
  }
})
onBeforeUnmount(() => observer?.disconnect())
watch(selectedIndex, placeIndicator, { flush: 'post' })
watch(() => items.length, placeIndicator, { flush: 'post' })

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
  <div class="sora-tabs" :data-orientation="orientation" :data-variant="variant" :data-size="resolvedSize">
    <div
      ref="list"
      class="sora-tabs__list"
      role="tablist"
      :aria-label="label"
      :aria-orientation="orientation"
      :data-fitted="fitted ? '' : undefined"
      @keydown="onKeydown"
    >
      <span ref="indicator" class="sora-tabs__indicator" aria-hidden="true" />
      <button
        v-for="(item, index) in items"
        :id="tabId(index)"
        :key="item.value"
        class="sora-tabs__tab"
        type="button"
        role="tab"
        :disabled="item.disabled"
        :tabindex="index === tabStop ? 0 : -1"
        :aria-selected="index === selectedIndex ? 'true' : 'false'"
        :aria-controls="index === selectedIndex ? panelId : undefined"
        @click="select(item)"
      >
        <SoraIcon v-if="item.icon" :icon="item.icon" />
        <slot name="tab" :item="item" :selected="index === selectedIndex">{{ item.label }}</slot>
      </button>
    </div>
    <div
      v-if="selectedItem"
      :id="panelId"
      :key="selectedItem.value"
      class="sora-tabs__panel"
      role="tabpanel"
      tabindex="0"
      :aria-labelledby="tabId(selectedIndex)"
    >
      <slot name="content" :item="selectedItem" />
    </div>
  </div>
</template>
