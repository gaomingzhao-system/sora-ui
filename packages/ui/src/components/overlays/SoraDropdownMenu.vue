<script setup lang="ts" vapor generic="T extends SoraMenuItem">
import { computed, useTemplateRef, watch, type ButtonHTMLAttributes } from 'vue'
import { usePopover } from '../../composables/use-overlay.ts'
import { isItemDisabled, useRovingFocus } from '../../composables/use-roving-focus.ts'
import { useTypeahead } from '../../composables/use-typeahead.ts'
import { useSoraLocale } from '../../composables/use-sora-locale.ts'
import { activeElement } from '../../internal/focus.ts'
import { anchorName, useSoraId } from '../../internal/ids.ts'
import type {
  SoraColor,
  SoraIconDefinition,
  SoraPlacement,
  SoraSize,
  SoraVariant,
} from '../../types/common.ts'
import SoraButton from '../actions/SoraButton.vue'
import SoraIcon from '../foundation/SoraIcon.vue'
import { isNativeInvoker, type SoraTriggerBindings } from './trigger.ts'

export interface SoraMenuItem {
  /** Unique within the menu. */
  id: string
  label: string
  icon?: SoraIconDefinition | undefined
  /** Stays focusable (so it can be discovered) but cannot be activated. */
  disabled?: boolean | undefined
  /** For example `error` for a destructive action. */
  color?: SoraColor | undefined
  /** Keys shown as a hint and exposed through `aria-keyshortcuts`. */
  shortcut?: readonly string[] | undefined
  /** Renders a link item (navigation) instead of a button item (action). */
  href?: string | undefined
  onSelect?: (() => void) | undefined
}

/** A group of items with an optional heading; groups are divided by separators. */
export interface SoraMenuGroup<TItem extends SoraMenuItem = SoraMenuItem> {
  label?: string | undefined
  items: readonly TItem[]
}

export interface SoraDropdownMenuProps<TItem extends SoraMenuItem = SoraMenuItem>
  extends /* @vue-ignore */ Omit<ButtonHTMLAttributes, 'type' | 'disabled' | 'onSelect'> {
  /** Items, or groups of items. */
  items: readonly (TItem | SoraMenuGroup<TItem>)[]
  /** Text of the built-in trigger button. Use the `trigger` slot for richer content. */
  triggerLabel?: string | undefined
  /** Accessible name of the menu. Defaults to the trigger's text. */
  label?: string | undefined
  placement?: SoraPlacement | undefined
  /** Appearance of the built-in trigger. */
  variant?: SoraVariant | undefined
  color?: SoraColor | undefined
  size?: SoraSize | undefined
  disabled?: boolean | undefined
}

defineOptions({ name: 'SoraDropdownMenu', inheritAttrs: false })

const {
  items,
  triggerLabel,
  label,
  placement = 'bottom-start',
  variant = 'outline',
  color = 'neutral',
  size,
  disabled = false,
} = defineProps<SoraDropdownMenuProps<T>>()

const open = defineModel<boolean>('open', { default: false })

const emit = defineEmits<{
  /** An enabled item was activated. */
  select: [item: T]
}>()

defineSlots<{
  /** Content of the library-owned trigger button. */
  trigger?(props: { open: boolean }): unknown
  /** A fully custom trigger: bind `attrs`, `on` and `ref` on its native element. */
  'custom-trigger'?(props: SoraTriggerBindings): unknown
  /** Content of one item (the label by default). */
  item?(props: { item: T }): unknown
}>()

const { locale } = useSoraLocale()
const id = useSoraId()
const triggerId = `${id}-trigger`
const menuId = `${id}-menu`
const anchor = anchorName(`${id}-anchor`)

const isGroup = (entry: T | SoraMenuGroup<T>): entry is SoraMenuGroup<T> => 'items' in entry

// Consecutive plain items form an unnamed group; explicit groups keep their label.
const groups = computed<SoraMenuGroup<T>[]>(() => {
  const result: SoraMenuGroup<T>[] = []
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

const show = async (target: 'first' | 'last' = 'first'): Promise<void> => {
  if (disabled) return
  focusOnOpen = target
  open.value = true
}

const close = (): void => {
  open.value = false
}

// Focus enters the menu in the same flush that opens the popover (this
// watcher is registered after usePopover's, so the popover is already in the
// top layer). Waiting for the asynchronous `toggle` event instead would let
// a quick second key press still land on the trigger.
watch(
  open,
  (isOpen) => {
    if (!isOpen) return
    const list = roving.items()
    ;(focusOnOpen === 'last' ? list.at(-1) : list[0])?.focus()
    focusOnOpen = 'first'
  },
  { flush: 'post' },
)

const onToggle = (event: Event): void => {
  popover.onToggle(event)
  if ((event as ToggleEvent).newState !== 'open') typeahead.reset()
}

const onTriggerKeydown = (event: KeyboardEvent): void => {
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault()
    void show(event.key === 'ArrowUp' ? 'last' : 'first')
  } else if (event.key === 'Enter' || event.key === ' ') {
    // From the keyboard the menu opens in this task, with focus on its first
    // item, so the next key already acts inside it. (A click goes through the
    // native invoker; its `toggle` event arrives one task later.)
    event.preventDefault()
    if (open.value) close()
    else void show('first')
  }
}

const onMenuKeydown = (event: KeyboardEvent): void => {
  if (event.key === 'Tab') {
    // Closing returns focus to the trigger; the Tab then continues from there.
    close()
    return
  }
  if (roving.onKeydown(event)) return
  typeahead.onKeydown(event)
}

const activate = (item: T, event: Event): void => {
  if (item.disabled) {
    event.preventDefault()
    return
  }
  item.onSelect?.()
  emit('select', item)
  close()
}

// Pointer and keyboard share one highlight: hovering an item focuses it.
const onPointermove = (event: PointerEvent): void => {
  const target = (event.target as HTMLElement).closest<HTMLElement>('[role="menuitem"]')
  if (target && activeElement() !== target && !isItemDisabled(target)) target.focus({ preventScroll: true })
}

const bindings = computed<SoraTriggerBindings>(() => ({
  attrs: {
    id: triggerId,
    'aria-haspopup': 'menu',
    'aria-expanded': open.value ? 'true' : 'false',
    'aria-controls': menuId,
    popovertarget: menuId,
    style: { 'anchor-name': anchor },
  },
  on: {
    click: (event) => {
      // A native invoker toggles the menu itself; focus then moves in when it opens.
      if (isNativeInvoker(event.currentTarget)) focusOnOpen = 'first'
      else if (open.value) close()
      else void show('first')
    },
    keydown: onTriggerKeydown,
  },
  ref: () => {},
  open: open.value,
}))

defineExpose({ open: () => show('first'), close })
</script>

<template>
  <slot name="custom-trigger" v-bind="bindings">
    <SoraButton
      v-bind="{ ...$attrs, ...bindings.attrs }"
      :variant="variant"
      :color="color"
      :size="size"
      :disabled="disabled"
      @click="bindings.on.click"
      @keydown="onTriggerKeydown"
    >
      <slot name="trigger" :open="open">{{ triggerLabel }}</slot>
    </SoraButton>
  </slot>
  <!--
    The trigger is a native invoker (`popovertarget`): the browser toggles the
    menu, light-dismisses it and returns focus. The menu keyboard model
    (arrows, Home/End, typeahead) is implemented here.
  -->
  <div
    :id="menuId"
    ref="menu"
    class="sora-popover sora-menu"
    popover="auto"
    role="menu"
    :data-placement="placement"
    :style="{ 'position-anchor': anchor }"
    :aria-labelledby="label ? undefined : triggerId"
    :aria-label="label"
    aria-orientation="vertical"
    @beforetoggle="popover.onBeforetoggle"
    @toggle="onToggle"
    @keydown="onMenuKeydown"
    @pointermove="onPointermove"
  >
    <template v-for="(group, groupIndex) in groups" :key="groupIndex">
      <hr v-if="groupIndex > 0" class="sora-menu__separator" />
      <div class="sora-menu__group" role="group" :aria-label="group.label">
        <div v-if="group.label" class="sora-menu__label" aria-hidden="true">{{ group.label }}</div>
        <component
          :is="item.href && !item.disabled ? 'a' : 'button'"
          v-for="item in group.items"
          :key="item.id"
          class="sora-menu__item"
          role="menuitem"
          tabindex="-1"
          :type="item.href && !item.disabled ? undefined : 'button'"
          :href="item.href && !item.disabled ? item.href : undefined"
          :data-color="item.color ?? 'neutral'"
          :aria-disabled="item.disabled ? 'true' : undefined"
          :aria-keyshortcuts="item.shortcut?.join('+')"
          @click="activate(item, $event)"
        >
          <SoraIcon v-if="item.icon" :icon="item.icon" class="sora-menu__icon" />
          <span class="sora-menu__text">
            <slot name="item" :item="item">{{ item.label }}</slot>
          </span>
          <span v-if="item.shortcut" class="sora-menu__shortcut" aria-hidden="true">{{
            item.shortcut.join(' ')
          }}</span>
        </component>
      </div>
    </template>
  </div>
</template>
