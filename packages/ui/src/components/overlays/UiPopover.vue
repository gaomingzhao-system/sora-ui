<script setup lang="ts" vapor>
import { computed, shallowRef, useTemplateRef } from 'vue'
import { usePopover } from '../../composables/use-overlay.ts'
import { anchorName, useUiId } from '../../internal/ids.ts'
import type { UiColor, UiPlacement, UiSize, UiVariant } from '../../types/common.ts'
import UiButton from '../actions/UiButton.vue'
import type { UiTriggerBindings } from './trigger.ts'

export interface UiPopoverProps {
  /** Text of the built-in trigger button. Use the `trigger` slot for richer content. */
  triggerLabel?: string | undefined
  /** Heading of the panel. With `title` (or `label`) the panel is a named, non-modal dialog. */
  title?: string | undefined
  /** Accessible name of the panel when there is no visible title. */
  label?: string | undefined
  placement?: UiPlacement | undefined
  /** Appearance of the built-in trigger. */
  variant?: UiVariant | undefined
  color?: UiColor | undefined
  size?: UiSize | undefined
  disabled?: boolean | undefined
  /** `auto` closes on outside click and Escape; `manual` only through the model. */
  dismiss?: 'auto' | 'manual' | undefined
}

defineOptions({ name: 'UiPopover', inheritAttrs: false })

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
} = defineProps<UiPopoverProps>()

const open = defineModel<boolean>('open', { default: false })

defineSlots<{
  /** Panel content. */
  default?(props: { close: () => void }): unknown
  /** Content of the library-owned trigger button. */
  trigger?(props: { open: boolean }): unknown
  /** A fully custom trigger: bind `attrs`, `on` and `ref` on its native element. */
  'custom-trigger'?(props: UiTriggerBindings): unknown
}>()

const id = useUiId()
const triggerId = `${id}-trigger`
const panelId = `${id}-panel`
const titleId = `${id}-title`
const anchor = anchorName(`${id}-anchor`)

const panel = useTemplateRef<HTMLElement>('panel')
const popover = usePopover({ element: () => panel.value, open })
const triggerElement = shallowRef<HTMLElement | null>(null)

const named = computed(() => Boolean(title) || Boolean(label))

function toggle(): void {
  if (!disabled) open.value = !open.value
}
function close(): void {
  open.value = false
}

const bindings = computed<UiTriggerBindings>(() => ({
  attrs: {
    id: triggerId,
    'aria-expanded': open.value ? 'true' : 'false',
    'aria-controls': panelId,
    'aria-haspopup': named.value ? 'dialog' : undefined,
    style: { 'anchor-name': anchor },
  },
  on: {
    click: toggle,
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
    <UiButton
      v-bind="{ ...$attrs, ...bindings.attrs }"
      :variant="variant"
      :color="color"
      :size="size"
      :disabled="disabled"
      @click="toggle"
    >
      <slot name="trigger" :open="open">{{ triggerLabel }}</slot>
    </UiButton>
  </slot>
  <!--
    Popover API: top layer, light dismiss and focus return are native. The
    panel follows the trigger in the DOM, so Tab moves into it naturally and
    it inherits tokens and direction from its real ancestors.
  -->
  <div
    :id="panelId"
    ref="panel"
    class="vui-popover"
    :popover="dismiss"
    :data-placement="placement"
    :style="{ 'position-anchor': anchor }"
    :role="named ? 'dialog' : undefined"
    :aria-labelledby="title ? titleId : undefined"
    :aria-label="title ? undefined : label"
    @toggle="popover.onToggle"
  >
    <p v-if="title" :id="titleId" class="vui-popover__title">{{ title }}</p>
    <slot :close="close" />
  </div>
</template>
