<script setup lang="ts" vapor>
// 1. Reactive props and destructured prop defaults.
const {
  label,
  size = 'md',
  count = 0,
} = defineProps<{
  label: string
  size?: 'sm' | 'md' | 'lg' | undefined
  count?: number | undefined
}>()
</script>

<template>
  <output data-testid="props" :data-size="size">{{ label }}:{{ count * 2 }}</output>
</template>
