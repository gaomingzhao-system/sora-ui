<script setup lang="ts" vapor>
import { computed, ref } from 'vue'
import {
  SoraButton,
  SoraDialog,
  SoraDrawer,
  SoraDropdownMenu,
  SoraIconButton,
  SoraInput,
  SoraPopover,
  SoraSwitch,
  SoraTooltip,
  iconMore,
} from '@your-scope/ui'
import type { SoraMenuGroup, SoraMenuItem, SoraSnapPoint } from '@your-scope/ui'
import DemoSection from '../components/DemoSection.vue'
import { useT } from '../i18n.ts'

const t = useT()
const dialogOpen = ref(false)
const confirmOpen = ref(false)
const drawerOpen = ref(false)
const sheetOpen = ref(false)
const sheetSnap = ref<SoraSnapPoint | undefined>(undefined)
const actionsOpen = ref(false)
// Three resting positions, like the detents of a native sheet.
const detents: SoraSnapPoint[] = [0.35, 0.65, 1]
const places = Array.from({ length: 16 }, (_, index) => index + 1)
const workspace = ref('Acme')
const notify = ref(true)
const lastAction = ref('')

const menu = computed<(SoraMenuItem | SoraMenuGroup)[]>(() => [
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
</script>

<template>
  <DemoSection name="SoraDialog">
    <div class="flex flex-wrap gap-2">
      <SoraButton variant="outline" color="neutral" data-testid="dialog-open" @click="dialogOpen = true">{{
        t('demo.dialog.open')
      }}</SoraButton>
      <SoraButton variant="outline" color="error" data-testid="confirm-open" @click="confirmOpen = true">{{
        t('demo.delete')
      }}</SoraButton>
    </div>
    <SoraDialog
      v-model:open="dialogOpen"
      :title="t('demo.dialog.title')"
      :description="t('demo.dialog.description')"
    >
      <div class="grid gap-3">
        <SoraInput v-model="workspace" :label="t('settings.name')" data-autofocus />
        <SoraSwitch v-model="notify" :label="t('demo.notifications')" label-placement="start" />
      </div>
      <template #footer="{ close }">
        <SoraButton variant="ghost" color="neutral" @click="close">{{ t('demo.cancel') }}</SoraButton>
        <SoraButton @click="close">{{ t('actions.done') }}</SoraButton>
      </template>
    </SoraDialog>
    <SoraDialog
      v-model:open="confirmOpen"
      role="alertdialog"
      size="sm"
      :title="t('demo.dialog.confirm')"
      :description="t('demo.dialog.confirm.body')"
      :closable="false"
      :close-on-backdrop="false"
    >
      <template #footer="{ close }">
        <SoraButton variant="ghost" color="neutral" data-autofocus @click="close">{{
          t('demo.dialog.keep')
        }}</SoraButton>
        <SoraButton color="error" @click="close">{{ t('demo.dialog.discard') }}</SoraButton>
      </template>
    </SoraDialog>
  </DemoSection>

  <DemoSection name="SoraDrawer">
    <div class="flex flex-wrap gap-2">
      <SoraButton variant="outline" color="neutral" data-testid="sheet-open" @click="sheetOpen = true">{{
        t('demo.sheet.open')
      }}</SoraButton>
      <SoraButton
        variant="outline"
        color="neutral"
        data-testid="action-sheet-open"
        @click="actionsOpen = true"
        >{{ t('demo.actionSheet.open') }}</SoraButton
      >
      <SoraButton variant="outline" color="neutral" data-testid="drawer-open" @click="drawerOpen = true">{{
        t('demo.drawer.open')
      }}</SoraButton>
    </div>

    <!-- A sheet with three resting positions: drag it, flick it, or tap the grabber. -->
    <SoraDrawer
      v-model:open="sheetOpen"
      v-model:snap-point="sheetSnap"
      :snap-points="detents"
      :title="t('demo.sheet.title')"
      :description="t('demo.sheet.description')"
      data-testid="sheet"
    >
      <ul class="grid gap-1">
        <li
          v-for="place in places"
          :key="place"
          class="rounded-sora border border-sora-border bg-sora-surface px-3 py-2.5 text-sora-sm"
        >
          {{ t('demo.sheet.place', { index: place }) }}
        </li>
      </ul>
    </SoraDrawer>

    <!-- An action sheet: as tall as its content. -->
    <SoraDrawer
      v-model:open="actionsOpen"
      fit
      :closable="false"
      :title="t('demo.actionSheet.title')"
      data-testid="action-sheet"
    >
      <template #default="{ close }">
        <div class="grid gap-2">
          <SoraButton block size="lg" variant="soft" color="neutral" @click="close">{{
            t('demo.popover.copy')
          }}</SoraButton>
          <SoraButton block size="lg" variant="soft" color="neutral" @click="close">{{
            t('demo.menu.duplicate')
          }}</SoraButton>
          <SoraButton block size="lg" variant="soft" color="error" @click="close">{{
            t('demo.delete')
          }}</SoraButton>
        </div>
      </template>
    </SoraDrawer>

    <!-- A side sheet: `end` is on the right in left-to-right text and on the left in right-to-left. -->
    <SoraDrawer
      v-model:open="drawerOpen"
      side="end"
      :title="t('demo.drawer.title')"
      :description="t('demo.dialog.description')"
    >
      <div class="grid gap-3">
        <SoraSwitch v-model="notify" :label="t('demo.notifications')" label-placement="start" />
        <SoraInput v-model="workspace" :label="t('settings.name')" />
      </div>
      <template #footer="{ close }">
        <SoraButton @click="close">{{ t('actions.done') }}</SoraButton>
      </template>
    </SoraDrawer>
  </DemoSection>

  <DemoSection name="SoraPopover">
    <div class="flex flex-wrap gap-2">
      <SoraPopover
        :trigger-label="t('demo.popover.trigger')"
        :title="t('demo.popover.title')"
        data-testid="popover-trigger"
      >
        <template #default="{ close }">
          <p class="mb-3 max-w-56 text-sora-sm text-sora-muted">{{ t('demo.popover.body') }}</p>
          <SoraButton size="sm" @click="close">{{ t('demo.popover.copy') }}</SoraButton>
        </template>
      </SoraPopover>
      <!-- A custom trigger binds attrs, listeners and the element ref explicitly. -->
      <SoraPopover placement="top" :label="t('demo.popover.title')">
        <template #custom-trigger="{ attrs, on, ref: setTrigger, open }">
          <button
            :ref="setTrigger"
            type="button"
            v-bind="attrs"
            class="rounded-sora border border-sora-border-strong px-3 text-sora-md"
            style="min-block-size: max(2.25rem, var(--sora-hit-min))"
            v-on="on"
          >
            {{ t('demo.open') }} ({{ open ? '−' : '+' }})
          </button>
        </template>
        <p class="max-w-56 text-sora-sm">{{ t('demo.popover.body') }}</p>
      </SoraPopover>
    </div>
  </DemoSection>

  <DemoSection name="SoraTooltip">
    <div class="flex flex-wrap gap-3">
      <SoraTooltip :text="t('demo.tooltip')">
        <template #default="{ describedBy }">
          <SoraButton
            variant="outline"
            color="neutral"
            :aria-describedby="describedBy"
            data-testid="tooltip-trigger"
          >
            {{ t('demo.popover.copy') }}
          </SoraButton>
        </template>
      </SoraTooltip>
      <SoraTooltip :text="t('demo.tooltip')" placement="bottom">
        <template #default="{ describedBy }">
          <SoraIconButton :label="t('demo.more')" :icon="iconMore" :aria-describedby="describedBy" />
        </template>
      </SoraTooltip>
    </div>
  </DemoSection>

  <DemoSection name="SoraDropdownMenu">
    <div class="flex flex-wrap items-center gap-3">
      <SoraDropdownMenu
        :items="menu"
        :trigger-label="t('demo.menu.trigger')"
        data-testid="menu-trigger"
        @select="lastAction = $event.id"
      />
      <span class="text-sora-sm text-sora-muted" data-testid="menu-result">{{
        t('demo.selected', { value: lastAction || '—' })
      }}</span>
    </div>
  </DemoSection>
</template>
