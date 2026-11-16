<script setup lang="ts" vapor>
import { ref } from 'vue'
import { UiButton, UiCard } from '@your-scope/ui'

const count = ref(0)
</script>

<template>
  <UiCard title="Basic" data-testid="basic-card">
    <p data-testid="basic-count">{{ count }}</p>
    <template #footer>
      <UiButton data-testid="basic-button" @click="count++">Increment</UiButton>
    </template>
  </UiCard>
</template>
