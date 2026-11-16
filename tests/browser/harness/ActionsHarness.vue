<script setup lang="ts" vapor>
import { useTemplateRef } from 'vue'
import {
  SoraButton,
  SoraButtonGroup,
  SoraIcon,
  SoraIconButton,
  SoraLink,
  SoraProvider,
  iconPlus,
} from '@your-scope/ui'

export interface ActionsState {
  loading: boolean
  disabled: boolean
  clicks: number
  submits: number
  variant: 'solid' | 'soft' | 'outline' | 'ghost' | 'link' | undefined
  linkDisabled: boolean
  href: string
}

const { state } = defineProps<{ state: ActionsState }>()
const button = useTemplateRef('button')
const iconButton = useTemplateRef('iconButton')

defineExpose({
  focusButton: () => button.value?.focus(),
  buttonElement: () => button.value?.element,
  focusIconButton: () => iconButton.value?.focus(),
})
</script>

<template>
  <form data-testid="form" @submit.prevent="state.submits++">
    <SoraButton
      ref="button"
      data-testid="button"
      class="from-caller"
      name="action"
      aria-describedby="help"
      :variant="state.variant"
      :loading="state.loading"
      :disabled="state.disabled"
      @click="state.clicks++"
    >
      <template #leading><SoraIcon :icon="iconPlus" /></template>
      Save changes
      <template #trailing><span data-testid="trailing">→</span></template>
    </SoraButton>
    <SoraButton type="submit" data-testid="submit" :loading="state.loading">Submit</SoraButton>
    <SoraButton data-testid="plain">Plain</SoraButton>
    <span id="help">Saves the form</span>
  </form>

  <SoraIconButton
    ref="iconButton"
    data-testid="icon-button"
    label="Add item"
    :icon="iconPlus"
    @click="state.clicks++"
  />

  <SoraButtonGroup data-testid="group" label="View" attached size="sm" variant="outline" color="neutral">
    <SoraButton data-testid="group-a">Day</SoraButton>
    <SoraButton data-testid="group-b" variant="solid">Week</SoraButton>
    <SoraIconButton data-testid="group-icon" label="More" :icon="iconPlus" />
  </SoraButtonGroup>

  <SoraProvider :defaults="{ button: { variant: 'soft', color: 'secondary', size: 'lg' } }">
    <SoraButton data-testid="provided">Provided</SoraButton>
  </SoraProvider>

  <SoraLink data-testid="link" :href="state.href" :disabled="state.linkDisabled">Docs</SoraLink>
  <SoraLink data-testid="external" :href="state.href" external underline="hover" color="neutral"
    >External</SoraLink
  >
</template>
