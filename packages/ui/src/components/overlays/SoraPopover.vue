<script setup lang="ts" vapor>
import { computed, shallowRef, useTemplateRef, type ButtonHTMLAttributes } from 'vue'
import { usePopover } from '../../composables/use-overlay.ts'
import { anchorName, useSoraId } from '../../internal/ids.ts'
import type { SoraColor, SoraPlacement, SoraSize, SoraVariant } from '../../types/common.ts'
import SoraButton from '../actions/SoraButton.vue'
import { isNativeInvoker, type SoraTriggerBindings } from './trigger.ts'

export interface SoraPopoverProps
  extends /* @vue-ignore */ Omit<ButtonHTMLAttributes, 'type' | 'disabled' | 'title'> {
  /** Text of the built-in trigger button. Use the `trigger` slot for richer content. */
  triggerLabel?: string | undefined
  /** Heading of the panel. With `title` (or `label`) the panel is a named, non-modal dialog. */
  title?: string | undefined
  /** Accessible name of the panel when there is no visible title. */
  label?: string | undefined
  placement?: SoraPlacement | undefined
  /** Appearance of the built-in trigger. */
  variant?: SoraVariant | undefined
  color?: SoraColor | undefined
  size?: SoraSize | undefined
  disabled?: boolean | undefined
  /** `auto` closes on outside click and Escape; `manual` only through the model. */
  dismiss?: 'auto' | 'manual' | undefined
}

defineOptions({ name: 'SoraPopover', inheritAttrs: false })

const {
  triggerLabel,
  title,
  label,
  placement = 'bottom-start',
  variant = 'outline',
  color = 'neutral',
  size,
  disabled = false,
  dismiss = 'auto',
} = defineProps<SoraPopoverProps>()

const open = defineModel<boolean>('open', { default: false })

defineSlots<{
  /** Panel content. */
  default?(props: { close: () => void }): unknown
  /** Content of the library-owned trigger button. */
  trigger?(props: { open: boolean }): unknown
  /** A fully custom trigger: bind `attrs`, `on` and `ref` on its native element. */
  'custom-trigger'?(props: SoraTriggerBindings): unknown
}>()

const id = useSoraId()
const triggerId = `${id}-trigger`
const panelId = `${id}-panel`
const titleId = `${id}-title`
const anchor = anchorName(`${id}-anchor`)

const panel = useTemplateRef<HTMLElement>('panel')
const popover = usePopover({ element: () => panel.value, open })
const triggerElement = shallowRef<HTMLElement | null>(null)

const named = computed(() => Boolean(title) || Boolean(label))

const toggle = (): void => {
  if (!disabled) open.value = !open.value
}
const close = (): void => {
  open.value = false
}

const bindings = computed<SoraTriggerBindings>(() => ({
  attrs: {
    id: triggerId,
    'aria-expanded': open.value ? 'true' : 'false',
    'aria-controls': panelId,
    'aria-haspopup': named.value ? 'dialog' : undefined,
    popovertarget: panelId,
    style: { 'anchor-name': anchor },
  },
  on: {
    // A native invoker toggles by itself; anything else is toggled here.
    click: (event) => {
      if (!isNativeInvoker(event.currentTarget)) toggle()
    },
    keydown: () => {},
  },
  ref: (element) => {
    triggerElement.value = element instanceof HTMLElement ? element : null
  },
  open: open.value,
}))

defineExpose({
  open: () => {
    if (!disabled) open.value = true
  },
  close,
  toggle,
})
</script>

<template>
  <slot name="custom-trigger" v-bind="bindings">
    <SoraButton
      v-bind="{ ...$attrs, ...bindings.attrs }"
      :variant="variant"
      :color="color"
      :size="size"
      :disabled="disabled"
    >
      <slot name="trigger" :open="open">{{ triggerLabel }}</slot>
    </SoraButton>
  </slot>
  <!--
    Popover API: the trigger is a native invoker (`popovertarget`), so the
    browser toggles the panel, light-dismisses it and returns focus. The
    panel follows the trigger in the DOM, so Tab moves into it naturally and
    it inherits tokens and direction from its real ancestors.
  -->
  <div
    :id="panelId"
    ref="panel"
    class="sora-popover"
    :popover="dismiss"
    :data-placement="placement"
    :style="{ 'position-anchor': anchor }"
    :role="named ? 'dialog' : undefined"
    :aria-labelledby="title ? titleId : undefined"
    :aria-label="title ? undefined : label"
    @beforetoggle="popover.onBeforetoggle"
    @toggle="popover.onToggle"
  >
    <p v-if="title" :id="titleId" class="sora-popover__title">{{ title }}</p>
    <slot :close="close" />
  </div>
</template>
