<script setup lang="ts" vapor>
import {
  UiAvatar,
  UiAvatarGroup,
  UiBadge,
  UiButton,
  UiCard,
  UiEmptyState,
  UiIcon,
  UiKbd,
  UiSeparator,
  iconCheck,
  iconChevronRight,
  iconSearch,
} from '@your-scope/ui'

export interface DisplayState {
  width: string
  src: string | undefined
  name: string | undefined
  people: { name: string; src?: string }[]
  max: number
  decorative: boolean
}

const { state } = defineProps<{ state: DisplayState }>()
</script>

<template>
  <div :style="{ inlineSize: state.width }">
    <UiCard
      as="section"
      data-testid="card"
      title="Account"
      description="Manage preferences"
      variant="elevated"
      padding="lg"
      :heading-level="2"
    >
      <p data-testid="card-body">Body</p>
      <template #actions><UiBadge data-testid="card-badge" color="success" dot>Active</UiBadge></template>
      <template #footer>
        <UiButton data-testid="card-cancel" variant="ghost">Cancel</UiButton>
        <UiButton data-testid="card-save">Save</UiButton>
      </template>
    </UiCard>
    <UiCard data-testid="card-plain">
      <template #header><strong data-testid="custom-header">Custom</strong></template>
    </UiCard>
  </div>

  <UiBadge data-testid="badge" variant="solid" color="error" size="lg">
    <template #leading><UiIcon :icon="iconCheck" /></template>
    Failed
  </UiBadge>

  <UiAvatar data-testid="avatar" :src="state.src" :name="state.name" size="lg" shape="square" />
  <UiAvatar data-testid="avatar-anon" />
  <UiAvatarGroup data-testid="avatar-group" :items="state.people" :max="state.max" label="Team" />

  <UiSeparator data-testid="separator" :decorative="state.decorative" orientation="vertical" />
  <UiSeparator data-testid="separator-label">or</UiSeparator>

  <UiKbd data-testid="kbd">Esc</UiKbd>
  <UiKbd data-testid="kbd-combo" :keys="['Ctrl', 'Shift', 'K']" />

  <UiEmptyState
    data-testid="empty"
    title="No projects"
    description="Create one to get started."
    :heading-level="4"
  >
    <template #actions><UiButton data-testid="empty-action">New project</UiButton></template>
  </UiEmptyState>

  <UiIcon data-testid="icon-decorative" :icon="iconSearch" />
  <UiIcon data-testid="icon-named" :icon="iconSearch" label="Search" size="lg" />
  <span dir="rtl"><UiIcon data-testid="icon-rtl" :icon="iconChevronRight" /></span>
  <span dir="rtl"><UiIcon data-testid="icon-rtl-plain" :icon="iconSearch" /></span>
</template>
