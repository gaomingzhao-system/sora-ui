<script setup lang="ts" vapor generic="T extends UiMenuItem">
import { computed, nextTick, useTemplateRef } from 'vue'
import { usePopover } from '../../composables/use-overlay.ts'
import { isItemDisabled, useRovingFocus } from '../../composables/use-roving-focus.ts'
import { useTypeahead } from '../../composables/use-typeahead.ts'
import { useUiLocale } from '../../composables/use-ui-locale.ts'
import { activeElement } from '../../internal/focus.ts'
import { anchorName, useUiId } from '../../internal/ids.ts'
import type { UiColor, UiIconDefinition, UiPlacement, UiSize, UiVariant } from '../../types/common.ts'
import UiButton from '../actions/UiButton.vue'
import UiIcon from '../foundation/UiIcon.vue'
import type { UiTriggerBindings } from './trigger.ts'

export interface UiMenuItem {
  /** Unique within the menu. */
  id: string
  label: string
  icon?: UiIconDefinition | undefined
  /** Stays focusable (so it can be discovered) but cannot be activated. */
  disabled?: boolean | undefined
  /** For example `error` for a destructive action. */
  color?: UiColor | undefined
  /** Keys shown as a hint and exposed through `aria-keyshortcuts`. */
  shortcut?: readonly string[] | undefined
  /** Renders a link item (navigation) instead of a button item (action). */
  href?: string | undefined
  onSelect?: (() => void) | undefined
}

/** A group of items with an optional heading; groups are divided by separators. */
export interface UiMenuGroup<TItem extends UiMenuItem = UiMenuItem> {
  label?: string | undefined
  items: readonly TItem[]
}

export interface UiDropdownMenuProps<TItem extends UiMenuItem = UiMenuItem> {
  /** Items, or groups of items. */
  items: readonly (TItem | UiMenuGroup<TItem>)[]
  /** Text of the built-in trigger button. Use the `trigger` slot for richer content. */
  triggerLabel?: string | undefined
  /** Accessible name of the menu. Defaults to the trigger's text. */
  label?: string | undefined
  placement?: UiPlacement | undefined
  /** Appearance of the built-in trigger. */
  variant?: UiVariant | undefined
  color?: UiColor | undefined
  size?: UiSize | undefined
  disabled?: boolean | undefined
}

defineOptions({ name: 'UiDropdownMenu', inheritAttrs: false })

const {
  items,
  triggerLabel,
  label,
  placement = 'bottom-start',
  variant = 'outline',
  color = 'neutral',
  size,
  disabled = false,
} = defineProps<UiDropdownMenuProps<T>>()

const open = defineModel<boolean>('open', { default: false })

const emit = defineEmits<{
  /** An enabled item was activated. */
  select: [item: T]
}>()

defineSlots<{
  /** Content of the library-owned trigger button. */
  trigger?(props: { open: boolean }): unknown
  /** A fully custom trigger: bind `attrs`, `on` and `ref` on its native element. */
  'custom-trigger'?(props: UiTriggerBindings): unknown
  /** Content of one item (the label by default). */
  item?(props: { item: T }): unknown
}>()

const { locale } = useUiLocale()
const id = useUiId()
const triggerId = `${id}-trigger`
const menuId = `${id}-menu`
const anchor = anchorName(`${id}-anchor`)

function isGroup(entry: T | UiMenuGroup<T>): entry is UiMenuGroup<T> {
  return 'items' in entry
}

// Consecutive plain items form an unnamed group; explicit groups keep their label.
const groups = computed<UiMenuGroup<T>[]>(() => {
  const result: UiMenuGroup<T>[] = []
  let loose: T[] | undefined
  for (const entry of items) {
    if (isGroup(entry)) {
      loose = undefined
      result.push(entry)
    } else {
      if (!loose) {
        loose = []
        result.push({ items: loose })
      }
      loose.push(entry)
    }
  }
  return result
})
const flat = computed(() => groups.value.flatMap((group) => group.items))

const menu = useTemplateRef<HTMLElement>('menu')
const popover = usePopover({ element: () => menu.value, open })

// Disabled items stay in the arrow-key order (APG menu pattern).
const roving = useRovingFocus({
  container: () => menu.value,
  selector: '[role="menuitem"]',
  orientation: () => 'vertical',
  skipDisabled: false,
})
const typeahead = useTypeahead({
  labels: () => flat.value.map((item) => item.label),
  current: () => roving.items().indexOf(activeElement() as HTMLElement),
  locale: () => locale.value,
  onMatch: (index) => roving.focusIndex(index),
})

/** Which item receives focus when the menu opens. */
let focusOnOpen: 'first' | 'last' = 'first'

async function show(target: 'first' | 'last' = 'first'): Promise<void> {
  if (disabled) return
  focusOnOpen = target
  open.value = true
}

function close(): void {
  open.value = false
}

function onToggle(event: Event): void {
  popover.onToggle(event)
  if ((event as ToggleEvent).newState !== 'open') {
    typeahead.reset()
    return
  }
  void nextTick(() => {
    const list = roving.items()
    ;(focusOnOpen === 'last' ? list.at(-1) : list[0])?.focus()
    focusOnOpen = 'first'
  })
}

function onTriggerKeydown(event: KeyboardEvent): void {
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault()
    void show(event.key === 'ArrowUp' ? 'last' : 'first')
  }
}

function onMenuKeydown(event: KeyboardEvent): void {
  if (event.key === 'Tab') {
    // Closing returns focus to the trigger; the Tab then continues from there.
    close()
    return
  }
  if (roving.onKeydown(event)) return
  typeahead.onKeydown(event)
}

function activate(item: T, event: Event): void {
  if (item.disabled) {
    event.preventDefault()
    return
  }
  item.onSelect?.()
  emit('select', item)
  close()
}

// Pointer and keyboard share one highlight: hovering an item focuses it.
function onPointermove(event: PointerEvent): void {
  const target = (event.target as HTMLElement).closest<HTMLElement>('[role="menuitem"]')
  if (target && activeElement() !== target && !isItemDisabled(target)) target.focus({ preventScroll: true })
}

const bindings = computed<UiTriggerBindings>(() => ({
  attrs: {
    id: triggerId,
    'aria-haspopup': 'menu',
    'aria-expanded': open.value ? 'true' : 'false',
    'aria-controls': menuId,
    style: { 'anchor-name': anchor },
  },
  on: {
    click: () => (open.value ? close() : void show('first')),
    keydown: onTriggerKeydown,
  },
  ref: () => {},
  open: open.value,
}))

defineExpose({ open: () => show('first'), close })
</script>

<template>
  <slot name="custom-trigger" v-bind="bindings">
    <UiButton
      v-bind="{ ...$attrs, ...bindings.attrs }"
      :variant="variant"
      :color="color"
      :size="size"
      :disabled="disabled"
      @click="bindings.on.click"
      @keydown="onTriggerKeydown"
    >
      <slot name="trigger" :open="open">{{ triggerLabel }}</slot>
    </UiButton>
  </slot>
  <!-- The Popover API supplies the top layer and light dismiss; the menu keyboard model is implemented here. -->
  <div
    :id="menuId"
    ref="menu"
    class="vui-popover vui-menu"
    popover="auto"
    role="menu"
    :data-placement="placement"
    :style="{ 'position-anchor': anchor }"
    :aria-labelledby="label ? undefined : triggerId"
    :aria-label="label"
    aria-orientation="vertical"
    @toggle="onToggle"
    @keydown="onMenuKeydown"
    @pointermove="onPointermove"
  >
    <template v-for="(group, groupIndex) in groups" :key="groupIndex">
      <div v-if="groupIndex > 0" class="vui-menu__separator" role="separator" />
      <div class="vui-menu__group" role="group" :aria-label="group.label">
        <div v-if="group.label" class="vui-menu__label" aria-hidden="true">{{ group.label }}</div>
        <component
          :is="item.href && !item.disabled ? 'a' : 'button'"
          v-for="item in group.items"
          :key="item.id"
          class="vui-menu__item"
          role="menuitem"
          tabindex="-1"
          :type="item.href && !item.disabled ? undefined : 'button'"
          :href="item.href && !item.disabled ? item.href : undefined"
          :data-color="item.color ?? 'neutral'"
          :aria-disabled="item.disabled ? 'true' : undefined"
          :aria-keyshortcuts="item.shortcut?.join('+')"
          @click="activate(item, $event)"
        >
          <UiIcon v-if="item.icon" :icon="item.icon" class="vui-menu__icon" />
          <span class="vui-menu__text">
            <slot name="item" :item="item">{{ item.label }}</slot>
          </span>
          <span v-if="item.shortcut" class="vui-menu__shortcut" aria-hidden="true">{{
            item.shortcut.join(' ')
          }}</span>
        </component>
      </div>
    </template>
  </div>
</template>
