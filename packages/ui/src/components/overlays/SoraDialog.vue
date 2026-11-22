<script setup lang="ts" vapor>
import { useTemplateRef, type DialogHTMLAttributes } from 'vue'
import { useModalDialog, type SoraCloseReason } from '../../composables/use-overlay.ts'
import { useSoraLocale } from '../../composables/use-sora-locale.ts'
import { iconClose } from '../../internal/icons.ts'
import { useSoraId } from '../../internal/ids.ts'
import SoraIconButton from '../actions/SoraIconButton.vue'

export interface SoraDialogProps
  extends /* @vue-ignore */ Omit<DialogHTMLAttributes, 'open' | 'title' | 'role' | 'onClose'> {
  /** Accessible name and visible heading. */
  title: string
  /** Supporting text, announced with the title. */
  description?: string | undefined
  size?: 'sm' | 'md' | 'lg' | 'full' | undefined
  /** Keep the title for assistive technology but hide it visually. */
  hideTitle?: boolean | undefined
  /** Show the close button in the header. */
  closable?: boolean | undefined
  /** Escape (and other platform close requests) may close the dialog. */
  closeOnEscape?: boolean | undefined
  /** A click on the backdrop may close the dialog. */
  closeOnBackdrop?: boolean | undefined
  /** `alertdialog` for interruptions that need an answer (confirmations). */
  role?: 'dialog' | 'alertdialog' | undefined
  /** Element to focus on open. Default: `[data-autofocus]`, else the first focusable element. */
  initialFocus?: (() => HTMLElement | null | undefined) | undefined
  /** Focus target on close when the opener no longer exists (or to override it). */
  returnFocus?: (() => HTMLElement | null | undefined) | undefined
}

defineOptions({ name: 'SoraDialog' })

const {
  title,
  description,
  size = 'md',
  hideTitle = false,
  closable = true,
  closeOnEscape = true,
  closeOnBackdrop = true,
  role = 'dialog',
  initialFocus,
  returnFocus,
} = defineProps<SoraDialogProps>()

const open = defineModel<boolean>('open', { default: false })

const emit = defineEmits<{
  /** The dialog closed, with what closed it. */
  close: [reason: SoraCloseReason]
}>()

defineSlots<{
  /** Dialog content. It stays mounted while closed. */
  default?(props: { close: () => void }): unknown
  /** Replaces the `description` text. */
  description?(): unknown
  /** Action row. */
  footer?(props: { close: () => void }): unknown
}>()

const { t } = useSoraLocale()
const id = useSoraId()
const titleId = `${id}-title`
const descriptionId = `${id}-description`
const dialog = useTemplateRef<HTMLDialogElement>('dialog')

const modal = useModalDialog({
  element: () => dialog.value,
  open,
  closeOnEscape: () => closeOnEscape,
  closeOnBackdrop: () => closeOnBackdrop,
  initialFocus: () => initialFocus?.(),
  returnFocus: () => returnFocus?.(),
  onClose: (reason) => emit('close', reason),
})

const close = (): void => modal.close('action')

defineExpose({
  /** Close the dialog (same as setting `v-model:open` to `false`). */
  close,
  /** The native dialog element. */
  get element() {
    return dialog.value
  },
})
</script>

<template>
  <!--
    showModal() (in useModalDialog) provides the top layer, the backdrop, focus
    containment and inert page content. `closedby` states the Escape policy
    declaratively where supported; the cancel handler covers the rest.
  -->
  <dialog
    ref="dialog"
    class="sora-dialog"
    :role="role === 'alertdialog' ? 'alertdialog' : undefined"
    :data-size="size"
    :closedby="closeOnEscape ? 'closerequest' : 'none'"
    :aria-labelledby="titleId"
    :aria-describedby="$slots.description || description ? descriptionId : undefined"
    @cancel="modal.onCancel"
    @close="modal.onClose"
    @pointerdown="modal.onPointerdown"
    @click="modal.onClick"
  >
    <div class="sora-dialog__panel">
      <header class="sora-dialog__header" :data-title-hidden="hideTitle ? '' : undefined">
        <div class="sora-dialog__heading">
          <h2 :id="titleId" class="sora-dialog__title" :data-visually-hidden="hideTitle ? '' : undefined">
            {{ title }}
          </h2>
          <p v-if="$slots.description || description" :id="descriptionId" class="sora-dialog__description">
            <slot name="description">{{ description }}</slot>
          </p>
        </div>
        <SoraIconButton
          v-if="closable"
          class="sora-dialog__close"
          :label="t('dialog.close')"
          :icon="iconClose"
          size="sm"
          variant="ghost"
          color="neutral"
          @click="close"
        />
      </header>
      <div class="sora-dialog__body"><slot :close="close" /></div>
      <footer v-if="$slots.footer" class="sora-dialog__footer"><slot name="footer" :close="close" /></footer>
    </div>
  </dialog>
</template>
