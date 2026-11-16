<script setup lang="ts" vapor>
import { useTemplateRef } from 'vue'
import { UiButton, UiButtonGroup, UiIcon, UiIconButton, UiLink, UiProvider, iconPlus } from '@your-scope/ui'

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
    <UiButton
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
      <template #leading><UiIcon :icon="iconPlus" /></template>
      Save changes
      <template #trailing><span data-testid="trailing">→</span></template>
    </UiButton>
    <UiButton type="submit" data-testid="submit" :loading="state.loading">Submit</UiButton>
    <UiButton data-testid="plain">Plain</UiButton>
    <span id="help">Saves the form</span>
  </form>

  <UiIconButton
    ref="iconButton"
    data-testid="icon-button"
    label="Add item"
    :icon="iconPlus"
    @click="state.clicks++"
  />

  <UiButtonGroup data-testid="group" label="View" attached size="sm" variant="outline" color="neutral">
    <UiButton data-testid="group-a">Day</UiButton>
    <UiButton data-testid="group-b" variant="solid">Week</UiButton>
    <UiIconButton data-testid="group-icon" label="More" :icon="iconPlus" />
  </UiButtonGroup>

  <UiProvider :defaults="{ button: { variant: 'soft', color: 'secondary', size: 'lg' } }">
    <UiButton data-testid="provided">Provided</UiButton>
  </UiProvider>

  <UiLink data-testid="link" :href="state.href" :disabled="state.linkDisabled">Docs</UiLink>
  <UiLink data-testid="external" :href="state.href" external underline="hover" color="neutral"
    >External</UiLink
  >
</template>
