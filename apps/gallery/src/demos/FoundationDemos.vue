<script setup lang="ts" vapor>
import {
  UiBadge,
  UiButton,
  UiCard,
  UiIcon,
  UiProvider,
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
  <DemoSection name="UiProvider">
    <div class="grid gap-3 sm:grid-cols-2">
      <UiProvider color-mode="dark" density="comfortable" class="contents">
        <UiCard variant="outline" class="bg-vui-canvas">
          <p class="mb-2 text-vui-sm text-vui-muted">{{ t('demo.provider.inner') }}</p>
          <UiButton>{{ t('demo.save') }}</UiButton>
        </UiCard>
      </UiProvider>
      <UiProvider radius="none" :defaults="{ button: { variant: 'outline', color: 'secondary' } }">
        <UiCard>
          <p class="mb-2 text-vui-sm text-vui-muted">{{ t('demo.provider.inner') }}</p>
          <UiButton>{{ t('demo.save') }}</UiButton>
        </UiCard>
      </UiProvider>
    </div>
  </DemoSection>

  <DemoSection name="UiIcon">
    <div class="flex flex-wrap items-center gap-4 text-vui-muted">
      <UiIcon :icon="iconCheck" size="sm" />
      <UiIcon :icon="iconSun" size="md" />
      <UiIcon :icon="iconSearch" size="lg" :label="t('demo.icon.named')" />
      <UiIcon :icon="iconChevronRight" size="lg" />
      <UiBadge color="info"
        ><template #leading><UiIcon :icon="iconCheck" /></template>{{ t('demo.badge.active') }}</UiBadge
      >
    </div>
  </DemoSection>
</template>
