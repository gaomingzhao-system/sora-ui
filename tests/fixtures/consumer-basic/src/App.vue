<script setup lang="ts" vapor>
import { ref } from 'vue'
import { SoraButton, SoraCard } from '@your-scope/ui'

const count = ref(0)
</script>

<template>
  <SoraCard title="Basic" data-testid="basic-card">
    <p data-testid="basic-count">{{ count }}</p>
    <template #footer>
      <SoraButton data-testid="basic-button" @click="count++">Increment</SoraButton>
    </template>
  </SoraCard>
</template>
