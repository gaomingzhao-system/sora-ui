<script setup lang="ts" vapor>
import { useToast } from '@your-scope/ui'

// No UiToastProvider above: useToast() must fail with a clear message.
const { report } = defineProps<{ report: (message: string) => void }>()
try {
  useToast()
  report('no error')
} catch (error) {
  report(error instanceof Error ? error.message : String(error))
}
</script>

<template><span /></template>
