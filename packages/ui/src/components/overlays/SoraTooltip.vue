<script setup lang="ts" vapor>
import { onBeforeUnmount, ref, useTemplateRef, watch } from 'vue'
import type { HTMLAttributes } from 'vue'
import { usePopover } from '../../composables/use-overlay.ts'
import { anchorName, useSoraId } from '../../internal/ids.ts'
import type { SoraPlacement } from '../../types/common.ts'

export interface SoraTooltipProps extends /* @vue-ignore */ HTMLAttributes {
  /** Supplementary text. Never the only place essential information lives. */
  text?: string | undefined
  placement?: SoraPlacement | undefined
  /** Delay before showing on hover, in milliseconds. Keyboard focus shows it immediately. */
  openDelay?: number | undefined
  /** Grace period before hiding, so the pointer can travel onto the tooltip. */
  closeDelay?: number | undefined
  disabled?: boolean | undefined
}

defineOptions({ name: 'SoraTooltip', inheritAttrs: false })

const {
  text,
  placement = 'top',
  openDelay = 500,
  closeDelay = 150,
  disabled = false,
} = defineProps<SoraTooltipProps>()

defineSlots<{
  /**
   * The trigger. Bind `describedBy` to `aria-describedby` on the focusable
   * control so the tooltip is announced with it.
   */
  default?(props: { describedBy: string }): unknown
  /** Tooltip content (replaces `text`). Text only: no interactive elements. */
  content?(): unknown
}>()

const id = useSoraId()
const tooltipId = `${id}-tooltip`
const anchor = anchorName(`${id}-anchor`)
const open = ref(false)
const tip = useTemplateRef<HTMLElement>('tip')
const wrapper = useTemplateRef<HTMLElement>('wrapper')
const popover = usePopover({ element: () => tip.value, open })

let timer: ReturnType<typeof setTimeout> | undefined
let hovering = false
let focused = false

function clear(): void {
  if (timer !== undefined) clearTimeout(timer)
  timer = undefined
}

function show(delay: number): void {
  if (disabled) return
  clear()
  if (delay <= 0) open.value = true
  else timer = setTimeout(() => (open.value = true), delay)
}

// Stays while the trigger is hovered or focused, or the tooltip itself is hovered.
function scheduleHide(): void {
  clear()
  timer = setTimeout(() => {
    if (!hovering && !focused) open.value = false
  }, closeDelay)
}

function onPointerenter(event: PointerEvent): void {
  if (event.pointerType === 'touch') return
  hovering = true
  show(openDelay)
}
function onPointerleave(): void {
  hovering = false
  scheduleHide()
}
function onFocusin(event: FocusEvent): void {
  const target = event.target
  if (!(target instanceof HTMLElement) || !target.matches(':focus-visible')) return
  focused = true
  show(0)
}
function onFocusout(event: FocusEvent): void {
  if (wrapper.value?.contains(event.relatedTarget as Node | null)) return
  focused = false
  scheduleHide()
}

// Escape dismisses the tooltip (and only the tooltip) while it is showing.
function onDocumentKeydown(event: KeyboardEvent): void {
  if (event.key !== 'Escape' || !open.value) return
  event.preventDefault()
  event.stopPropagation()
  clear()
  open.value = false
}

watch(open, (value, _previous, onCleanup) => {
  if (!value) return
  document.addEventListener('keydown', onDocumentKeydown, true)
  onCleanup(() => document.removeEventListener('keydown', onDocumentKeydown, true))
})

watch(
  () => disabled,
  (value) => {
    if (value) {
      clear()
      open.value = false
    }
  },
)

onBeforeUnmount(clear)
</script>

<template>
  <span
    ref="wrapper"
    v-bind="$attrs"
    class="sora-tooltip-anchor"
    :style="{ 'anchor-name': anchor }"
    @pointerenter="onPointerenter"
    @pointerleave="onPointerleave"
    @focusin="onFocusin"
    @focusout="onFocusout"
  >
    <slot :described-by="tooltipId" />
  </span>
  <span
    :id="tooltipId"
    ref="tip"
    class="sora-tooltip"
    role="tooltip"
    popover="hint"
    :data-placement="placement"
    :style="{ 'position-anchor': anchor }"
    @toggle="popover.onToggle"
    @pointerenter="hovering = true"
    @pointerleave="onPointerleave"
  >
    <slot name="content">{{ text }}</slot>
  </span>
</template>
