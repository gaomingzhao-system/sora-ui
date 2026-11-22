<script setup lang="ts" vapor>
import {
  SoraButton,
  SoraDrawer,
  SoraInput,
  SoraProvider,
  type SoraCloseReason,
  type SoraDrawerSide,
  type SoraSnapPoint,
} from '@your-scope/ui'

export interface DrawerState {
  open: boolean
  /** The owner ignores `update:open`, so the sheet must stay open. */
  keepOpen: boolean
  snap: SoraSnapPoint | undefined
  /** The drawer's own options under test. */
  props: {
    side?: SoraDrawerSide
    snapPoints?: SoraSnapPoint[]
    fit?: boolean
    dismissible?: boolean
    modal?: boolean
    handleOnly?: boolean
    scaleBackground?: boolean | string
  }
  motion: 'none' | 'subtle'
  events: string[]
  closes: SoraCloseReason[]
  progress: number[]
  items: number
  footer: boolean
  header: boolean
  nested: boolean
  nestedOpen: boolean
}

const { state } = defineProps<{ state: DrawerState }>()

const setOpen = (value: boolean): void => {
  if (!state.keepOpen) state.open = value
}
</script>

<template>
  <SoraProvider :motion="state.motion">
    <div class="page" data-sora-drawer-background data-testid="page">
      <button type="button" data-testid="trigger" @click="state.open = true">open</button>
      <button type="button" data-testid="outside">outside</button>
    </div>

    <SoraDrawer
      v-bind="state.props"
      :open="state.open"
      :snap-point="state.snap"
      data-testid="drawer"
      title="Nearby"
      description="Places around you"
      @update:open="setOpen"
      @update:snap-point="state.snap = $event"
      @opened="state.events.push('opened')"
      @close="(reason) => (state.events.push('closed'), state.closes.push(reason))"
      @drag="state.progress.push($event)"
    >
      <template v-if="state.header" #header="{ expanded }">
        <p data-testid="custom-header">Header {{ expanded }}</p>
      </template>
      <template #default="{ close, snapPoint, expanded }">
        <p data-testid="slot-state">{{ snapPoint }} {{ expanded }}</p>
        <SoraButton data-testid="inner-close" @click="close">Done</SoraButton>
        <SoraInput model-value="" label="Search" data-testid="input" />
        <p v-for="index in state.items" :key="index" class="row">Row {{ index }}</p>
        <SoraButton v-if="state.nested" data-testid="open-nested" @click="state.nestedOpen = true"
          >More</SoraButton
        >
        <SoraDrawer
          v-if="state.nested"
          v-model:open="state.nestedOpen"
          data-testid="nested"
          title="Details"
          :snap-points="[0.5]"
        >
          <p>Nested</p>
        </SoraDrawer>
      </template>
      <template v-if="state.footer" #footer="{ close }">
        <SoraButton data-testid="footer-close" @click="close">Close</SoraButton>
      </template>
    </SoraDrawer>
  </SoraProvider>
</template>
