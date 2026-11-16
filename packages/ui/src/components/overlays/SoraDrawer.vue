<script setup lang="ts" vapor>
import { computed, useTemplateRef } from 'vue'
import type { DialogHTMLAttributes } from 'vue'
import type { SoraCloseReason } from '../../composables/use-overlay.ts'
import { useSheet } from '../../composables/use-sheet.ts'
import type { SoraDrawerSide } from '../../composables/use-sheet.ts'
import { useSoraLocale } from '../../composables/use-sora-locale.ts'
import { iconClose } from '../../internal/icons.ts'
import { useSoraId } from '../../internal/ids.ts'
import type { SoraSnapPoint } from '../../internal/sheet.ts'
import SoraIconButton from '../actions/SoraIconButton.vue'

export type { SoraDrawerSide, SoraSnapPoint }

export interface SoraDrawerProps
  extends /* @vue-ignore */ Omit<DialogHTMLAttributes, 'open' | 'title' | 'role' | 'onClose' | 'onDrag'> {
  /** Accessible name and visible heading. */
  title: string
  /** Supporting text under the title, announced with it. */
  description?: string | undefined
  /** Edge the sheet comes from. `start` and `end` follow the writing direction. */
  side?: SoraDrawerSide | undefined
  /**
   * Resting positions, from the smallest to the largest, as the visible share
   * of the sheet: `0.5`, `'50%'`, `240` or `'240px'`. The sheet opens at the
   * first one. Its content scrolls once it rests at the largest.
   */
  snapPoints?: readonly SoraSnapPoint[] | undefined
  /** Size the sheet to its content instead of filling the available space. */
  fit?: boolean | undefined
  /** Width of `start`/`end` sheets and the maximum width of `top`/`bottom` ones. */
  size?: 'sm' | 'md' | 'lg' | 'full' | undefined
  /** Dragging it away, tapping the backdrop and Escape close the sheet. */
  dismissible?: boolean | undefined
  /**
   * A modal sheet dims the page, makes it inert and keeps focus inside.
   * `false` leaves the page usable behind the sheet.
   */
  modal?: boolean | undefined
  /** Show the grab handle. Default: for `top` and `bottom` sheets. */
  handle?: boolean | undefined
  /** Only start drags from the handle, or from elements with `data-sora-drag-handle`. */
  handleOnly?: boolean | undefined
  /**
   * Index of the snap point from which the backdrop is fully visible. It
   * fades in while the sheet moves there from the snap point before it.
   */
  fadeFrom?: number | undefined
  /**
   * Push the page back like a stack of cards while the sheet is expanded.
   * `true` scales the element with `data-sora-drawer-background`; a string is a selector.
   */
  scaleBackground?: boolean | string | undefined
  /** Share of the way from the smallest snap point to closed that closes the sheet on release. */
  closeThreshold?: number | undefined
  /** Keep the title for assistive technology but hide it visually. */
  hideTitle?: boolean | undefined
  /** Show a close button in the header (only when the sheet is dismissible). */
  closable?: boolean | undefined
}

/** Passed to the `default`, `header` and `footer` slots. */
export interface SoraDrawerSlotProps {
  close: () => void
  /** Animate to one of the snap points. */
  snapTo: (point: SoraSnapPoint) => void
  /** The snap point the sheet rests at. */
  snapPoint: SoraSnapPoint
  /** Whether it rests at its largest snap point. */
  expanded: boolean
}

defineOptions({ name: 'SoraDrawer' })

const {
  title,
  description,
  side = 'bottom',
  snapPoints,
  fit = false,
  size = 'md',
  dismissible = true,
  modal = true,
  // An explicit `undefined` default: an absent boolean prop would otherwise be cast to `false`.
  handle = undefined,
  handleOnly = false,
  fadeFrom = 0,
  scaleBackground = false,
  closeThreshold = 0.25,
  hideTitle = false,
  closable = true,
} = defineProps<SoraDrawerProps>()

/** Whether the sheet is open. If the owner does not update it, the sheet stays open. */
const open = defineModel<boolean>('open', { default: false })
/** The snap point the sheet rests at. It returns to the first one when the sheet closes. */
const snapPoint = defineModel<SoraSnapPoint | undefined>('snapPoint')

const emit = defineEmits<{
  /** The sheet has closed (its exit animation is over), with what closed it. */
  close: [reason: SoraCloseReason]
  /** The opening animation has finished. */
  opened: []
  /** While dragging: how much of the sheet is visible, from 0 to 1. */
  drag: [progress: number]
}>()

const slots = defineSlots<{
  /** Content. It scrolls once the sheet is expanded, and stays mounted while closed. */
  default?(props: SoraDrawerSlotProps): unknown
  /** Replaces the title and description. */
  header?(props: SoraDrawerSlotProps): unknown
  /** Replaces the `description` text. */
  description?(): unknown
  /** Stays on screen at every snap point. */
  footer?(props: SoraDrawerSlotProps): unknown
}>()

const { t } = useSoraLocale()
const id = useSoraId()
const titleId = `${id}-title`
const descriptionId = `${id}-description`

const dialog = useTemplateRef<HTMLElement>('dialog')
const panel = useTemplateRef<HTMLElement>('panel')
const backdrop = useTemplateRef<HTMLElement>('backdrop')
const body = useTemplateRef<HTMLElement>('body')
const footer = useTemplateRef<HTMLElement>('footer')

const vertical = computed(() => side === 'top' || side === 'bottom')
const points = computed<readonly SoraSnapPoint[]>(() => (snapPoints?.length ? snapPoints : [1]))
const showHandle = computed(() => handle ?? vertical.value)
const described = computed(() => Boolean(slots.description) || Boolean(description))

const sheet = useSheet({
  open,
  snapPoint,
  snapPoints: () => points.value,
  side: () => side,
  dismissible: () => dismissible,
  modal: () => modal,
  fadeFrom: () => fadeFrom,
  scaleBackground: () => scaleBackground,
  closeThreshold: () => closeThreshold,
  handleOnly: () => handleOnly,
  dialog: () => dialog.value,
  panel: () => panel.value,
  backdrop: () => backdrop.value,
  body: () => body.value,
  footer: () => footer.value,
  onDrag: (progress) => emit('drag', progress),
  onOpened: () => emit('opened'),
  onClosed: (reason) => emit('close', reason),
})

const close = (): void => sheet.close('action')

const slotProps = computed<SoraDrawerSlotProps>(() => ({
  close,
  snapTo: sheet.snapTo,
  snapPoint: sheet.activeSnapPoint.value,
  expanded: sheet.expanded.value,
}))

// The handle is a button: Enter and Space step through the snap points, the
// arrow keys move to the larger or the smaller one.
function onHandleKeydown(event: KeyboardEvent): void {
  if (!vertical.value || (event.key !== 'ArrowUp' && event.key !== 'ArrowDown')) return
  event.preventDefault()
  const grows = side === 'bottom' ? 'ArrowUp' : 'ArrowDown'
  sheet.step(event.key === grows ? 1 : -1)
}

defineExpose({
  /** Close the sheet (same as setting `v-model:open` to `false`). */
  close,
  /** Animate to one of the snap points. */
  snapTo: sheet.snapTo,
  /** The layer element: a `<dialog>` for a modal sheet, a popover `<div>` otherwise. */
  get element() {
    return dialog.value
  },
})
</script>

<template>
  <!--
    A modal sheet is a native <dialog>: `showModal()` supplies the top layer,
    the inert page, focus containment, Escape and focus return. A non-modal
    sheet is a manual popover (top layer, no focus move, page stays usable).
    Either way the element is a transparent, full-viewport layer; script only
    ever moves the panel and fades the backdrop.
  -->
  <component
    :is="modal ? 'dialog' : 'div'"
    ref="dialog"
    class="sora-drawer"
    :role="modal ? undefined : 'dialog'"
    :popover="modal ? undefined : 'manual'"
    :closedby="modal ? (dismissible ? 'closerequest' : 'none') : undefined"
    :data-side="side"
    :data-size="size"
    :data-state="sheet.visible.value ? 'open' : 'closed'"
    :data-modal="modal ? '' : undefined"
    :data-fit="fit ? '' : undefined"
    :data-expanded="sheet.expanded.value ? '' : undefined"
    :data-dragging="sheet.dragging.value ? '' : undefined"
    :aria-labelledby="$slots.header ? undefined : titleId"
    :aria-label="$slots.header ? title : undefined"
    :aria-describedby="!$slots.header && described ? descriptionId : undefined"
    @cancel="sheet.onCancel"
    @close="sheet.onNativeClose"
    @keydown="sheet.onKeydown"
  >
    <div v-if="modal" ref="backdrop" class="sora-drawer__backdrop" @click="sheet.onBackdropClick" />
    <div
      ref="panel"
      class="sora-drawer__panel"
      tabindex="-1"
      :autofocus="modal"
      @pointerdown="sheet.onPointerdown"
    >
      <template v-if="showHandle">
        <button
          v-if="points.length > 1"
          type="button"
          class="sora-drawer__handle"
          :aria-label="t('drawer.handle')"
          @click="sheet.step(0)"
          @keydown="onHandleKeydown"
        />
        <div v-else class="sora-drawer__handle" aria-hidden="true" />
      </template>
      <header class="sora-drawer__header" :data-title-hidden="hideTitle ? '' : undefined">
        <div class="sora-drawer__heading">
          <slot name="header" v-bind="slotProps">
            <h2 :id="titleId" class="sora-drawer__title" :data-visually-hidden="hideTitle ? '' : undefined">
              {{ title }}
            </h2>
            <p v-if="described" :id="descriptionId" class="sora-drawer__description">
              <slot name="description">{{ description }}</slot>
            </p>
          </slot>
        </div>
        <SoraIconButton
          v-if="closable && dismissible"
          class="sora-drawer__close"
          :label="t('dialog.close')"
          :icon="iconClose"
          size="sm"
          variant="soft"
          color="neutral"
          data-sora-no-drag
          @click="close"
        />
      </header>
      <div ref="body" class="sora-drawer__body"><slot v-bind="slotProps" /></div>
      <footer v-if="$slots.footer" ref="footer" class="sora-drawer__footer">
        <slot name="footer" v-bind="slotProps" />
      </footer>
    </div>
  </component>
</template>
