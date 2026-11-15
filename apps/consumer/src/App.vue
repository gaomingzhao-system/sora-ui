<script setup lang="ts" vapor>
import { ref } from 'vue'
import { UiButton } from '@your-scope/ui'
import type { UiButtonProps } from '@your-scope/ui'
import UiButtonDirect from '@your-scope/ui/components/UiButton'

const size = ref<NonNullable<UiButtonProps['size']>>('md')
const clicks = ref(0)
</script>

<template>
  <main>
    <UiButton
      :size="size"
      variant="soft"
      data-testid="consumer-button"
      aria-label="Count"
      name="counter"
      :disabled="clicks > 3"
      @click="clicks++"
      >Clicked {{ clicks }}</UiButton
    >
    <UiButtonDirect type="submit">Direct import</UiButtonDirect>
  </main>
</template>
