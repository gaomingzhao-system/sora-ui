<script setup lang="ts" vapor>
import { computed, onBeforeUnmount, onMounted, provide, shallowRef, useTemplateRef, watch } from 'vue'
import type { HTMLAttributes } from 'vue'
import { uiToastKey } from '../../composables/use-toast.ts'
import type { UiToast, UiToastApi, UiToastInput } from '../../composables/use-toast.ts'
import { useUiLocale } from '../../composables/use-ui-locale.ts'
import { iconClose } from '../../internal/icons.ts'
import { useUiId } from '../../internal/ids.ts'
import UiButton from '../actions/UiButton.vue'
import UiIconButton from '../actions/UiIconButton.vue'

export interface UiToastProviderProps extends /* @vue-ignore */ HTMLAttributes {
  /** Default lifetime of a toast in milliseconds (`0` = until dismissed). */
  duration?: number | undefined
  /** Toasts shown at once; the rest wait in the queue. */
  max?: number | undefined
  /** Corner (or edge) of the viewport, in logical terms. */
  placement?: 'top-start' | 'top' | 'top-end' | 'bottom-start' | 'bottom' | 'bottom-end' | undefined
  /** Accessible name of the notification region. */
  label?: string | undefined
}

// Two roots (the slot and the region): attributes go to the region.
defineOptions({ name: 'UiToastProvider', inheritAttrs: false })

const { duration = 5000, max = 3, placement = 'bottom-end', label } = defineProps<UiToastProviderProps>()

defineSlots<{
  /** Application content; anything inside can call `useToast()`. */
  default?(): unknown
}>()

const { t } = useUiLocale()
const idPrefix = useUiId()
let sequence = 0

const toasts = shallowRef<readonly UiToast[]>([])
const visible = computed(() => toasts.value.slice(0, Math.max(1, max)))
const polite = computed(() => visible.value.filter((toast) => !toast.urgent))
const urgent = computed(() => visible.value.filter((toast) => toast.urgent))

// Auto-dismiss timers. `remaining` survives a pause (hover or focus inside the region).
interface Timer {
  remaining: number
  startedAt: number
  handle: ReturnType<typeof setTimeout> | undefined
}
const timers = new Map<string, Timer>()
let paused = false

function start(id: string): void {
  const timer = timers.get(id)
  if (!timer || timer.handle !== undefined || paused || timer.remaining <= 0) return
  timer.startedAt = performance.now()
  timer.handle = setTimeout(() => dismiss(id), timer.remaining)
}

function stop(id: string): void {
  const timer = timers.get(id)
  if (timer?.handle === undefined) return
  clearTimeout(timer.handle)
  timer.handle = undefined
  timer.remaining = Math.max(0, timer.remaining - (performance.now() - timer.startedAt))
}

function pause(): void {
  paused = true
  for (const id of timers.keys()) stop(id)
}

function resume(): void {
  paused = false
  for (const toast of visible.value) start(toast.id)
}

function dismiss(id: string): void {
  stop(id)
  timers.delete(id)
  toasts.value = toasts.value.filter((toast) => toast.id !== id)
}

function add(input: UiToastInput): string {
  const id = input.id ?? `${idPrefix}-toast-${++sequence}`
  const toast: UiToast = {
    id,
    title: input.title,
    description: input.description,
    color: input.color ?? 'neutral',
    duration: input.duration ?? duration,
    urgent: input.urgent ?? false,
    action: input.action,
  }
  stop(id)
  timers.set(id, { remaining: toast.duration, startedAt: 0, handle: undefined })
  const existing = toasts.value.findIndex((entry) => entry.id === id)
  toasts.value = existing < 0 ? [...toasts.value, toast] : toasts.value.with(existing, toast)
  return id
}

function clear(): void {
  for (const id of timers.keys()) stop(id)
  timers.clear()
  toasts.value = []
}

const api: UiToastApi = {
  add,
  dismiss,
  clear,
  get toasts() {
    return toasts.value
  },
}
provide(uiToastKey, api)

const region = useTemplateRef<HTMLElement>('region')

// The region is a manual popover that stays open: it lives in the top layer
// (above dialog backdrops) and its live regions exist before any toast is
// inserted, which is what makes insertions announce reliably.
function show(): void {
  const element = region.value
  if (element?.isConnected && !element.matches(':popover-open')) element.showPopover()
}

watch(
  visible,
  (current) => {
    for (const toast of current) start(toast.id)
    // Re-enter the top layer so a toast raised while a dialog (or another
    // popover) is open is not covered by it. When nothing else is in the top
    // layer the region is left alone, so its live regions are never disturbed.
    const element = region.value
    if (current.length === 0 || !element?.isConnected || !element.matches(':popover-open')) return
    const covered = [...document.querySelectorAll(':modal, :popover-open')].some((node) => node !== element)
    if (covered) {
      element.hidePopover()
      element.showPopover()
    }
  },
  { flush: 'post' },
)

onMounted(show)
onBeforeUnmount(() => {
  for (const id of timers.keys()) stop(id)
  timers.clear()
  const element = region.value
  if (element?.isConnected && element.matches(':popover-open')) element.hidePopover()
})

function runAction(toast: UiToast): void {
  toast.action?.onClick()
  dismiss(toast.id)
}

function onFocusout(event: FocusEvent): void {
  if (!region.value?.contains(event.relatedTarget as Node | null)) resume()
}
</script>

<template>
  <slot />
  <section
    v-bind="$attrs"
    ref="region"
    class="vui-toast-region"
    popover="manual"
    :aria-label="label ?? t('toast.region')"
    :data-placement="placement"
    :data-empty="visible.length === 0 ? '' : undefined"
    @pointerenter="pause"
    @pointerleave="resume"
    @focusin="pause"
    @focusout="onFocusout"
  >
    <!--
      Two persistent live regions: polite status messages and exceptional
      assertive alerts. Plain containers on purpose: the status and alert
      roles are not allowed on list elements.
    -->
    <div class="vui-toast-region__list" role="status" aria-live="polite" aria-relevant="additions text">
      <div v-for="toast in polite" :key="toast.id" class="vui-toast" :data-color="toast.color">
        <div class="vui-toast__content">
          <p class="vui-toast__title">{{ toast.title }}</p>
          <p v-if="toast.description" class="vui-toast__description">{{ toast.description }}</p>
        </div>
        <UiButton
          v-if="toast.action"
          class="vui-toast__action"
          size="sm"
          variant="outline"
          color="neutral"
          @click="runAction(toast)"
        >
          {{ toast.action.label }}
        </UiButton>
        <UiIconButton
          :label="t('toast.dismiss')"
          :icon="iconClose"
          size="sm"
          variant="ghost"
          color="neutral"
          @click="dismiss(toast.id)"
        />
      </div>
    </div>
    <div class="vui-toast-region__list" role="alert" aria-live="assertive" aria-relevant="additions text">
      <div v-for="toast in urgent" :key="toast.id" class="vui-toast" :data-color="toast.color" data-urgent>
        <div class="vui-toast__content">
          <p class="vui-toast__title">{{ toast.title }}</p>
          <p v-if="toast.description" class="vui-toast__description">{{ toast.description }}</p>
        </div>
        <UiButton
          v-if="toast.action"
          class="vui-toast__action"
          size="sm"
          variant="outline"
          color="neutral"
          @click="runAction(toast)"
        >
          {{ toast.action.label }}
        </UiButton>
        <UiIconButton
          :label="t('toast.dismiss')"
          :icon="iconClose"
          size="sm"
          variant="ghost"
          color="neutral"
          @click="dismiss(toast.id)"
        />
      </div>
    </div>
  </section>
</template>
