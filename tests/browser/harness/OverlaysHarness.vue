<script setup lang="ts" vapor>
import { computed, useTemplateRef } from 'vue'
import {
  SoraButton,
  SoraCombobox,
  SoraDialog,
  SoraDrawer,
  SoraDropdownMenu,
  SoraPopover,
  SoraTooltip,
} from '@your-scope/ui'
import type { SoraCloseReason, SoraMenuGroup, SoraMenuItem } from '@your-scope/ui'

export interface OverlaysState {
  dialogOpen: boolean
  closeOnEscape: boolean
  closeOnBackdrop: boolean
  closes: SoraCloseReason[]
  showTrigger: boolean
  showDialog: boolean
  useReturnFocus: boolean
  drawerOpen: boolean
  popoverOpen: boolean
  manualOpen: boolean
  customOpen: boolean
  menuOpen: boolean
  selected: string[]
  ran: string[]
  tooltipDisabled: boolean
  nestedOpen: boolean
  fruit: string | null
}

const { state } = defineProps<{ state: OverlaysState }>()
const dialog = useTemplateRef('dialog')
const fallback = useTemplateRef<HTMLButtonElement>('fallback')

const items = computed<(SoraMenuItem | SoraMenuGroup)[]>(() => [
  { id: 'edit', label: 'Edit', shortcut: ['E'], onSelect: () => state.ran.push('edit') },
  { id: 'duplicate', label: 'Duplicate' },
  { id: 'move', label: 'Move', disabled: true },
  { id: 'docs', label: 'Documentation', href: '#docs' },
  {
    label: 'Danger zone',
    items: [
      { id: 'archive', label: 'Archive' },
      { id: 'delete', label: 'Delete', color: 'error' },
    ],
  },
])
const fruits = [
  { value: 'apple', label: 'Apple' },
  { value: 'cherry', label: 'Cherry' },
]

defineExpose({ dialog: () => dialog.value })
</script>

<template>
  <button ref="fallback" type="button" data-testid="fallback">fallback</button>
  <div tabindex="0" data-testid="focusable-ancestor">
    <button
      v-if="state.showTrigger"
      type="button"
      data-testid="dialog-trigger"
      @click="state.dialogOpen = true"
    >
      open
    </button>

    <SoraDialog
      v-if="state.showDialog"
      ref="dialog"
      v-model:open="state.dialogOpen"
      data-testid="dialog"
      title="Settings"
      description="Adjust the workspace"
      :close-on-escape="state.closeOnEscape"
      :close-on-backdrop="state.closeOnBackdrop"
      :return-focus="state.useReturnFocus ? () => fallback : undefined"
      @close="state.closes.push($event)"
    >
      <input data-testid="dialog-first" />
      <input data-testid="dialog-auto" data-autofocus />
      <template #footer="{ close }">
        <SoraButton data-testid="dialog-done" @click="close">Done</SoraButton>
      </template>
    </SoraDialog>
  </div>

  <button type="button" data-testid="drawer-trigger" @click="state.drawerOpen = true">drawer</button>
  <SoraDrawer v-model:open="state.drawerOpen" data-testid="drawer" title="Filters" side="start" size="sm">
    <p data-testid="drawer-body">content</p>
  </SoraDrawer>

  <SoraPopover
    v-model:open="state.popoverOpen"
    data-testid="popover-trigger"
    trigger-label="Share"
    title="Share this page"
    placement="bottom-start"
  >
    <template #default="{ close }">
      <button type="button" data-testid="popover-inner" @click="close">Copy</button>
    </template>
  </SoraPopover>
  <SoraPopover
    v-model:open="state.manualOpen"
    data-testid="manual-trigger"
    trigger-label="Manual"
    dismiss="manual"
  >
    <p data-testid="manual-body">stays</p>
  </SoraPopover>
  <SoraPopover v-model:open="state.customOpen" label="Custom panel">
    <template #custom-trigger="{ attrs, on, ref: setTrigger, open }">
      <button :ref="setTrigger" type="button" data-testid="custom-trigger" v-bind="attrs" v-on="on">
        {{ open ? 'close' : 'open' }}
      </button>
    </template>
    <p data-testid="custom-body">custom</p>
  </SoraPopover>

  <SoraTooltip
    text="Copies the link"
    :open-delay="60"
    :close-delay="60"
    :disabled="state.tooltipDisabled"
    data-testid="tooltip-wrapper"
  >
    <template #default="{ describedBy }">
      <button type="button" data-testid="tooltip-trigger" :aria-describedby="describedBy">Copy</button>
    </template>
  </SoraTooltip>

  <SoraDropdownMenu
    v-model:open="state.menuOpen"
    data-testid="menu-trigger"
    :items="items"
    trigger-label="Options"
    @select="state.selected.push($event.id)"
  />

  <button type="button" data-testid="nested-trigger" @click="state.nestedOpen = true">nested</button>
  <SoraDialog v-model:open="state.nestedOpen" data-testid="nested-dialog" title="Nested">
    <SoraCombobox v-model="state.fruit" data-testid="nested-combobox" :options="fruits" label="Fruit" />
    <SoraDropdownMenu
      data-testid="nested-menu"
      :items="items"
      trigger-label="More"
      @select="state.selected.push($event.id)"
    />
    <SoraTooltip text="Inside a dialog" :open-delay="0">
      <template #default="{ describedBy }">
        <button type="button" data-testid="nested-tooltip" :aria-describedby="describedBy">Tip</button>
      </template>
    </SoraTooltip>
  </SoraDialog>
  <button type="button" data-testid="after">after</button>
</template>
