<script setup lang="ts" vapor>
import { computed, ref } from 'vue'
import {
  UiButton,
  UiDialog,
  UiDrawer,
  UiDropdownMenu,
  UiIconButton,
  UiInput,
  UiPopover,
  UiSwitch,
  UiTooltip,
  iconMore,
} from '@your-scope/ui'
import type { UiMenuGroup, UiMenuItem } from '@your-scope/ui'
import DemoSection from '../components/DemoSection.vue'
import { useT } from '../i18n.ts'

const t = useT()
const dialogOpen = ref(false)
const confirmOpen = ref(false)
const drawerOpen = ref(false)
const drawerSide = ref<'start' | 'end' | 'bottom'>('end')
const workspace = ref('Acme')
const notify = ref(true)
const lastAction = ref('')

const menu = computed<(UiMenuItem | UiMenuGroup)[]>(() => [
  { id: 'edit', label: t('demo.menu.edit'), shortcut: ['E'] },
  { id: 'duplicate', label: t('demo.menu.duplicate') },
  { id: 'move', label: t('demo.menu.move'), disabled: true },
  {
    label: t('demo.menu.group'),
    items: [
      { id: 'archive', label: t('demo.menu.archive') },
      { id: 'delete', label: t('demo.menu.delete'), color: 'error' },
    ],
  },
])

function openDrawer(side: 'start' | 'end' | 'bottom'): void {
  drawerSide.value = side
  drawerOpen.value = true
}
</script>

<template>
  <DemoSection name="UiDialog">
    <div class="flex flex-wrap gap-2">
      <UiButton variant="outline" color="neutral" data-testid="dialog-open" @click="dialogOpen = true">{{
        t('demo.dialog.open')
      }}</UiButton>
      <UiButton variant="outline" color="error" data-testid="confirm-open" @click="confirmOpen = true">{{
        t('demo.delete')
      }}</UiButton>
    </div>
    <UiDialog
      v-model:open="dialogOpen"
      :title="t('demo.dialog.title')"
      :description="t('demo.dialog.description')"
    >
      <div class="grid gap-3">
        <UiInput v-model="workspace" :label="t('settings.name')" data-autofocus />
        <UiSwitch v-model="notify" :label="t('demo.notifications')" label-placement="start" />
      </div>
      <template #footer="{ close }">
        <UiButton variant="ghost" color="neutral" @click="close">{{ t('demo.cancel') }}</UiButton>
        <UiButton @click="close">{{ t('actions.done') }}</UiButton>
      </template>
    </UiDialog>
    <UiDialog
      v-model:open="confirmOpen"
      role="alertdialog"
      size="sm"
      :title="t('demo.dialog.confirm')"
      :description="t('demo.dialog.confirm.body')"
      :closable="false"
      :close-on-backdrop="false"
    >
      <template #footer="{ close }">
        <UiButton variant="ghost" color="neutral" data-autofocus @click="close">{{
          t('demo.dialog.keep')
        }}</UiButton>
        <UiButton color="error" @click="close">{{ t('demo.dialog.discard') }}</UiButton>
      </template>
    </UiDialog>
  </DemoSection>

  <DemoSection name="UiDrawer">
    <div class="flex flex-wrap gap-2">
      <UiButton variant="outline" color="neutral" data-testid="drawer-open" @click="openDrawer('end')">{{
        t('demo.drawer.open')
      }}</UiButton>
      <UiButton variant="ghost" color="neutral" @click="openDrawer('start')">start</UiButton>
      <UiButton variant="ghost" color="neutral" @click="openDrawer('bottom')">bottom</UiButton>
    </div>
    <UiDrawer
      v-model:open="drawerOpen"
      :side="drawerSide"
      :title="t('demo.drawer.title')"
      :description="t('demo.dialog.description')"
    >
      <div class="grid gap-3">
        <UiSwitch v-model="notify" :label="t('demo.notifications')" label-placement="start" />
        <UiInput v-model="workspace" :label="t('settings.name')" />
      </div>
      <template #footer="{ close }">
        <UiButton @click="close">{{ t('actions.done') }}</UiButton>
      </template>
    </UiDrawer>
  </DemoSection>

  <DemoSection name="UiPopover">
    <div class="flex flex-wrap gap-2">
      <UiPopover
        :trigger-label="t('demo.popover.trigger')"
        :title="t('demo.popover.title')"
        data-testid="popover-trigger"
      >
        <template #default="{ close }">
          <p class="mb-3 max-w-56 text-vui-sm text-vui-muted">{{ t('demo.popover.body') }}</p>
          <UiButton size="sm" @click="close">{{ t('demo.popover.copy') }}</UiButton>
        </template>
      </UiPopover>
      <!-- A custom trigger binds attrs, listeners and the element ref explicitly. -->
      <UiPopover placement="top" :label="t('demo.popover.title')">
        <template #custom-trigger="{ attrs, on, ref: setTrigger, open }">
          <button
            :ref="setTrigger"
            type="button"
            v-bind="attrs"
            class="rounded-vui border border-vui-border-strong px-3 text-vui-md"
            style="min-block-size: max(2.25rem, var(--vui-hit-min))"
            v-on="on"
          >
            {{ t('demo.open') }} ({{ open ? '−' : '+' }})
          </button>
        </template>
        <p class="max-w-56 text-vui-sm">{{ t('demo.popover.body') }}</p>
      </UiPopover>
    </div>
  </DemoSection>

  <DemoSection name="UiTooltip">
    <div class="flex flex-wrap gap-3">
      <UiTooltip :text="t('demo.tooltip')">
        <template #default="{ describedBy }">
          <UiButton
            variant="outline"
            color="neutral"
            :aria-describedby="describedBy"
            data-testid="tooltip-trigger"
          >
            {{ t('demo.popover.copy') }}
          </UiButton>
        </template>
      </UiTooltip>
      <UiTooltip :text="t('demo.tooltip')" placement="bottom">
        <template #default="{ describedBy }">
          <UiIconButton :label="t('demo.more')" :icon="iconMore" :aria-describedby="describedBy" />
        </template>
      </UiTooltip>
    </div>
  </DemoSection>

  <DemoSection name="UiDropdownMenu">
    <div class="flex flex-wrap items-center gap-3">
      <UiDropdownMenu
        :items="menu"
        :trigger-label="t('demo.menu.trigger')"
        data-testid="menu-trigger"
        @select="lastAction = $event.id"
      />
      <span class="text-vui-sm text-vui-muted" data-testid="menu-result">{{
        t('demo.selected', { value: lastAction || '—' })
      }}</span>
    </div>
  </DemoSection>
</template>
