<script setup lang="ts" vapor>
// 5. Conditional rendering and cleanup.
import { onBeforeUnmount, onMounted, onScopeDispose, watch } from 'vue'

const props = defineProps<{ log: string[]; tick: number }>()

function onResize(): void {}

onMounted(() => {
  window.addEventListener('resize', onResize)
  props.log.push('mounted')
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize)
  props.log.push('beforeUnmount')
})
onScopeDispose(() => props.log.push('scopeDispose'))
watch(
  () => props.tick,
  (tick, _previous, onCleanup) => {
    props.log.push(`tick:${tick}`)
    onCleanup(() => props.log.push(`cleanup:${tick}`))
  },
)
</script>

<template>
  <p data-testid="lifecycle">alive {{ tick }}</p>
</template>
