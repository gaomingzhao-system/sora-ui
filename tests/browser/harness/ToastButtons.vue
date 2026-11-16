<script setup lang="ts" vapor>
import { useToast } from '@your-scope/ui'

const { actions } = defineProps<{ actions: string[] }>()
const toast = useToast()
let count = 0

defineExpose({ toast })
</script>

<template>
  <button
    type="button"
    data-testid="toast-add"
    @click="toast.add({ title: `Toast ${++count}`, description: 'Details' })"
  >
    add
  </button>
  <button
    type="button"
    data-testid="toast-urgent"
    @click="toast.add({ title: 'Urgent', urgent: true, color: 'error' })"
  >
    urgent
  </button>
  <button type="button" data-testid="toast-sticky" @click="toast.add({ title: 'Sticky', duration: 0 })">
    sticky
  </button>
  <button
    type="button"
    data-testid="toast-same"
    @click="toast.add({ id: 'same', title: `Same ${++count}`, duration: 0 })"
  >
    same
  </button>
  <button
    type="button"
    data-testid="toast-action"
    @click="
      toast.add({
        title: 'Deleted',
        duration: 0,
        action: { label: 'Undo', onClick: () => actions.push('undo') },
      })
    "
  >
    action
  </button>
  <button type="button" data-testid="toast-clear" @click="toast.clear()">clear</button>
  <output data-testid="toast-count">{{ toast.toasts.length }}</output>
</template>
