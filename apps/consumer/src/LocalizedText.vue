<script setup lang="ts" vapor>
import { useUiLocale } from '@your-scope/ui'

/** Renders one application message through the provider's translator. */
const { message, count } = defineProps<{ message: string; count?: number | undefined }>()
const { t, formatNumber } = useUiLocale()
</script>

<template>
  {{ t(message).replace('{count}', count === undefined ? '' : formatNumber(count)) }}
</template>
