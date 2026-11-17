<script setup lang="ts" vapor>
// Layout primitive: label + scoped default slot + conditional hint slot.
import { computed, provide, useId } from 'vue'
import { patternKey } from './pattern-context.ts'

const { label, tone = 'plain' } = defineProps<{ label: string; tone?: string }>()
defineSlots<{
  default?(props: { controlId: string; describedBy: string | undefined }): unknown
  hint?(): unknown
}>()

const id = useId()
const controlId = `${id}-control`
const hintId = `${id}-hint`
provide(
  patternKey,
  computed(() => `tone:${tone}`),
)
</script>

<template>
  <div class="pattern-field" data-testid="pattern-field">
    <label :for="controlId">{{ label }}</label>
    <slot :control-id="controlId" :described-by="$slots.hint ? hintId : undefined" />
    <p v-if="$slots.hint" :id="hintId" data-testid="pattern-hint"><slot name="hint" /></p>
  </div>
</template>
