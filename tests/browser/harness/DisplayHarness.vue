<script setup lang="ts" vapor>
import {
  SoraAvatar,
  SoraAvatarGroup,
  SoraBadge,
  SoraButton,
  SoraCard,
  SoraEmptyState,
  SoraIcon,
  SoraKbd,
  SoraSeparator,
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
    <SoraCard
      as="section"
      data-testid="card"
      title="Account"
      description="Manage preferences"
      variant="elevated"
      padding="lg"
      :heading-level="2"
    >
      <p data-testid="card-body">Body</p>
      <template #actions><SoraBadge data-testid="card-badge" color="success" dot>Active</SoraBadge></template>
      <template #footer>
        <SoraButton data-testid="card-cancel" variant="ghost">Cancel</SoraButton>
        <SoraButton data-testid="card-save">Save</SoraButton>
      </template>
    </SoraCard>
    <SoraCard data-testid="card-plain">
      <template #header><strong data-testid="custom-header">Custom</strong></template>
    </SoraCard>
  </div>

  <SoraBadge data-testid="badge" variant="solid" color="error" size="lg">
    <template #leading><SoraIcon :icon="iconCheck" /></template>
    Failed
  </SoraBadge>

  <SoraAvatar data-testid="avatar" :src="state.src" :name="state.name" size="lg" shape="square" />
  <SoraAvatar data-testid="avatar-anon" />
  <SoraAvatarGroup data-testid="avatar-group" :items="state.people" :max="state.max" label="Team" />

  <SoraSeparator data-testid="separator" :decorative="state.decorative" orientation="vertical" />
  <SoraSeparator data-testid="separator-label">or</SoraSeparator>

  <SoraKbd data-testid="kbd">Esc</SoraKbd>
  <SoraKbd data-testid="kbd-combo" :keys="['Ctrl', 'Shift', 'K']" />

  <SoraEmptyState
    data-testid="empty"
    title="No projects"
    description="Create one to get started."
    :heading-level="4"
  >
    <template #actions><SoraButton data-testid="empty-action">New project</SoraButton></template>
  </SoraEmptyState>

  <SoraIcon data-testid="icon-decorative" :icon="iconSearch" />
  <SoraIcon data-testid="icon-named" :icon="iconSearch" label="Search" size="lg" />
  <span dir="rtl"><SoraIcon data-testid="icon-rtl" :icon="iconChevronRight" /></span>
  <span dir="rtl"><SoraIcon data-testid="icon-rtl-plain" :icon="iconSearch" /></span>
</template>
