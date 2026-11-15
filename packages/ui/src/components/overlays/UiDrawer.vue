<script setup lang="ts" vapor>
import { useTemplateRef } from 'vue'
import type { DialogHTMLAttributes } from 'vue'
import type { UiCloseReason } from '../../composables/use-overlay.ts'
import UiDialog from './UiDialog.vue'

export interface UiDrawerProps
  extends /* @vue-ignore */ Omit<DialogHTMLAttributes, 'open' | 'title' | 'role'> {
  /** Accessible name and visible heading. */
  title: string
  description?: string | undefined
  /** Edge the panel is attached to. `start`/`end` follow the writing direction. */
  side?: 'start' | 'end' | 'top' | 'bottom' | undefined
  size?: 'sm' | 'md' | 'lg' | 'full' | undefined
  hideTitle?: boolean | undefined
  closable?: boolean | undefined
  closeOnEscape?: boolean | undefined
  closeOnBackdrop?: boolean | undefined
  initialFocus?: (() => HTMLElement | null | undefined) | undefined
  returnFocus?: (() => HTMLElement | null | undefined) | undefined
}

defineOptions({ name: 'UiDrawer' })

const {
  title,
  description,
  side = 'end',
  size = 'md',
  hideTitle = false,
  closable = true,
  closeOnEscape = true,
  closeOnBackdrop = true,
  initialFocus,
  returnFocus,
} = defineProps<UiDrawerProps>()

const open = defineModel<boolean>('open', { default: false })

const emit = defineEmits<{
  close: [reason: UiCloseReason]
}>()

defineSlots<{
  default?(props: { close: () => void }): unknown
  description?(): unknown
  footer?(props: { close: () => void }): unknown
}>()

const dialog = useTemplateRef('dialog')

defineExpose({
  close: () => dialog.value?.close(),
  get element() {
    return dialog.value?.element
  },
})
</script>

<template>
  <!-- A drawer is a modal dialog docked to an edge: same focus, Escape and backdrop behaviour. -->
  <UiDialog
    ref="dialog"
    v-model:open="open"
    class="vui-drawer"
    :data-side="side"
    :title="title"
    :description="description"
    :size="size"
    :hide-title="hideTitle"
    :closable="closable"
    :close-on-escape="closeOnEscape"
    :close-on-backdrop="closeOnBackdrop"
    :initial-focus="initialFocus"
    :return-focus="returnFocus"
    @close="emit('close', $event)"
  >
    <template #default="{ close }"><slot :close="close" /></template>
    <template v-if="$slots.description" #description><slot name="description" /></template>
    <template v-if="$slots.footer" #footer="{ close }"><slot name="footer" :close="close" /></template>
  </UiDialog>
</template>
