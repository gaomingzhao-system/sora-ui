<script setup lang="ts" vapor>
// A component placed in another component's slot must see what the slot host provides.
import { inject } from 'vue'
import { patternKey } from './pattern-context.ts'

const { as = 'span' } = defineProps<{ as?: 'span' | 'div' }>()
const tone = inject(patternKey, undefined)
</script>

<template>
  <component :is="as" data-testid="pattern-dynamic" :data-tone="tone ?? 'none'">dyn</component>
</template>
