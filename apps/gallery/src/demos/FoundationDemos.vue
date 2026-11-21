<script setup lang="ts" vapor>
import {
  SoraBadge,
  SoraButton,
  SoraCard,
  SoraIcon,
  SoraProvider,
  iconCheck,
  iconChevronRight,
  iconSearch,
  iconSun,
} from '@your-scope/ui'
import DemoSection from '../components/DemoSection.vue'
import { useT } from '../i18n.ts'

const t = useT()
</script>

<template>
  <DemoSection name="SoraProvider">
    <div class="grid gap-3 sm:grid-cols-2">
      <SoraProvider color-mode="dark" density="comfortable" class="contents">
        <SoraCard variant="outline" class="bg-sora-canvas">
          <p class="mb-2 text-sora-sm text-sora-muted">{{ t('demo.provider.inner') }}</p>
          <SoraButton>{{ t('demo.save') }}</SoraButton>
        </SoraCard>
      </SoraProvider>
      <SoraProvider radius="none" :defaults="{ button: { variant: 'outline', color: 'secondary' } }">
        <SoraCard>
          <p class="mb-2 text-sora-sm text-sora-muted">{{ t('demo.provider.inner') }}</p>
          <SoraButton>{{ t('demo.save') }}</SoraButton>
        </SoraCard>
      </SoraProvider>
    </div>
  </DemoSection>

  <DemoSection name="SoraIcon">
    <div class="flex flex-wrap items-center gap-4 text-sora-muted">
      <SoraIcon :icon="iconCheck" size="sm" />
      <SoraIcon :icon="iconSun" size="md" />
      <SoraIcon :icon="iconSearch" size="lg" :label="t('demo.icon.named')" />
      <SoraIcon :icon="iconChevronRight" size="lg" />
      <SoraBadge color="info"
        ><template #leading><SoraIcon :icon="iconCheck" /></template>{{ t('demo.badge.active') }}</SoraBadge
      >
    </div>
  </DemoSection>
</template>
