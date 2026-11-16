<script setup lang="ts" vapor>
import { UiAlert, UiButton, UiProgress, UiSkeleton, UiSpinner, UiToastProvider } from '@your-scope/ui'
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
  <UiAlert data-testid="alert-info" title="Heads up" description="Trial ends soon." />
  <UiAlert data-testid="alert-error" color="error" title="Failed">Payment failed.</UiAlert>
  <UiAlert
    data-testid="alert-static"
    color="warning"
    announce="off"
    :icon="null"
    description="Static note."
  />
  <UiAlert
    v-model:open="state.alertOpen"
    data-testid="alert-dismissible"
    color="success"
    variant="outline"
    dismissible
    title="Saved"
    @dismiss="state.dismissed++"
  >
    Done.
    <template #actions><UiButton data-testid="alert-action" size="sm">Undo</UiButton></template>
  </UiAlert>

  <UiSpinner data-testid="spinner" />
  <UiSpinner data-testid="spinner-custom" label="Uploading files" size="lg" />
  <UiSpinner data-testid="spinner-decorative" decorative />

  <UiProgress data-testid="progress" :value="state.progress" label="Upload" show-value />
  <UiProgress data-testid="progress-unnamed" :value="5" :max="20" />

  <UiSkeleton data-testid="skeleton" :lines="3" />
  <UiSkeleton data-testid="skeleton-status" shape="rect" announce />

  <UiAlert
    v-model:open="state.lateAlertOpen"
    data-testid="alert-late"
    class="from-caller"
    title="Mounted closed"
  />

  <UiToastProvider
    v-if="state.showProvider"
    :duration="state.duration"
    :max="state.max"
    label="Messages"
    class="from-caller"
    data-testid="toast-region"
  >
    <ToastButtons :actions="state.actions" />
  </UiToastProvider>
</template>
