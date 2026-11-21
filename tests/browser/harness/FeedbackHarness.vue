<script setup lang="ts" vapor>
import {
  SoraAlert,
  SoraButton,
  SoraProgress,
  SoraSkeleton,
  SoraSpinner,
  SoraToastProvider,
} from '@your-scope/ui'
import ToastButtons from './ToastButtons.vue'

export interface FeedbackState {
  alertOpen: boolean
  /** An alert that is mounted closed and opened later. */
  lateAlertOpen: boolean
  dismissed: number
  progress: number | null
  duration: number
  max: number
  actions: string[]
  showProvider: boolean
}

const { state } = defineProps<{ state: FeedbackState }>()
</script>

<template>
  <SoraAlert data-testid="alert-info" title="Heads up" description="Trial ends soon." />
  <SoraAlert data-testid="alert-error" color="error" title="Failed">Payment failed.</SoraAlert>
  <SoraAlert
    data-testid="alert-static"
    color="warning"
    announce="off"
    :icon="null"
    description="Static note."
  />
  <SoraAlert
    v-model:open="state.alertOpen"
    data-testid="alert-dismissible"
    color="success"
    variant="outline"
    dismissible
    title="Saved"
    @dismiss="state.dismissed++"
  >
    Done.
    <template #actions><SoraButton data-testid="alert-action" size="sm">Undo</SoraButton></template>
  </SoraAlert>

  <SoraSpinner data-testid="spinner" />
  <SoraSpinner data-testid="spinner-custom" label="Uploading files" size="lg" />
  <SoraSpinner data-testid="spinner-decorative" decorative />

  <SoraProgress data-testid="progress" :value="state.progress" label="Upload" show-value />
  <SoraProgress data-testid="progress-unnamed" :value="5" :max="20" />

  <SoraSkeleton data-testid="skeleton" :lines="3" />
  <SoraSkeleton data-testid="skeleton-status" shape="rect" announce />

  <SoraAlert
    v-model:open="state.lateAlertOpen"
    data-testid="alert-late"
    class="from-caller"
    title="Mounted closed"
  />

  <SoraToastProvider
    v-if="state.showProvider"
    :duration="state.duration"
    :max="state.max"
    label="Messages"
    class="from-caller"
    data-testid="toast-region"
  >
    <ToastButtons :actions="state.actions" />
  </SoraToastProvider>
</template>
