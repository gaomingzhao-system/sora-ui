<script setup lang="ts" vapor>
import { ref } from 'vue'
import {
  SoraButton,
  SoraButtonGroup,
  SoraIcon,
  SoraIconButton,
  SoraLink,
  iconMore,
  iconPlus,
  iconSearch,
} from '@your-scope/ui'
import DemoSection from '../components/DemoSection.vue'
import { useT } from '../i18n.ts'

const t = useT()
const variants = ['solid', 'soft', 'outline', 'ghost', 'link'] as const
const colors = ['primary', 'secondary', 'success', 'info', 'warning', 'error', 'neutral'] as const
// Kept in script: vue-tsc 3.3.14 mis-parses `//` inside a static component attribute (docs/compatibility.md).
const docsUrl = 'https://vuejs.org'
const saving = ref(false)
const view = ref<'day' | 'week' | 'month'>('week')

function save(): void {
  saving.value = true
  setTimeout(() => (saving.value = false), 1500)
}
</script>

<template>
  <DemoSection name="SoraButton">
    <div class="grid gap-2">
      <div v-for="variant in variants" :key="variant" class="flex flex-wrap items-center gap-2">
        <SoraButton v-for="color in colors" :key="color" :variant="variant" :color="color">{{
          t('demo.label')
        }}</SoraButton>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <SoraButton size="sm">{{ t('demo.add') }}</SoraButton>
        <SoraButton>{{ t('demo.add') }}</SoraButton>
        <SoraButton size="lg">{{ t('demo.add') }}</SoraButton>
        <SoraButton variant="outline" color="neutral">
          <template #leading><SoraIcon :icon="iconPlus" /></template>
          {{ t('demo.add') }}
        </SoraButton>
        <SoraButton :loading="saving" data-testid="demo-save" @click="save">{{ t('demo.save') }}</SoraButton>
        <SoraButton disabled>{{ t('demo.disabled') }}</SoraButton>
      </div>
    </div>
  </DemoSection>

  <DemoSection name="SoraIconButton">
    <div class="flex flex-wrap items-center gap-2">
      <SoraIconButton :label="t('demo.search')" :icon="iconSearch" />
      <SoraIconButton :label="t('demo.add')" :icon="iconPlus" variant="outline" />
      <SoraIconButton :label="t('demo.more')" :icon="iconMore" variant="soft" size="sm" />
      <SoraIconButton :label="t('demo.add')" :icon="iconPlus" variant="solid" color="primary" size="lg" />
      <SoraIconButton :label="t('demo.search')" :icon="iconSearch" loading />
      <SoraIconButton :label="t('demo.search')" :icon="iconSearch" disabled />
    </div>
  </DemoSection>

  <DemoSection name="SoraButtonGroup">
    <div class="flex flex-wrap items-center gap-4">
      <SoraButtonGroup attached variant="outline" color="neutral" :label="t('demo.date')">
        <SoraButton :aria-pressed="view === 'day'" @click="view = 'day'">1</SoraButton>
        <SoraButton :aria-pressed="view === 'week'" @click="view = 'week'">7</SoraButton>
        <SoraButton :aria-pressed="view === 'month'" @click="view = 'month'">30</SoraButton>
      </SoraButtonGroup>
      <SoraButtonGroup size="sm" :label="t('workspace.actions')">
        <SoraButton variant="ghost" color="neutral">{{ t('demo.cancel') }}</SoraButton>
        <SoraButton>{{ t('demo.save') }}</SoraButton>
      </SoraButtonGroup>
    </div>
  </DemoSection>

  <DemoSection name="SoraLink">
    <p class="flex flex-wrap items-center gap-4">
      <SoraLink href="#/foundations">{{ t('nav.foundations') }}</SoraLink>
      <SoraLink :href="docsUrl" external>{{ t('demo.docs') }}</SoraLink>
      <SoraLink href="#/forms" color="neutral" underline="hover">{{ t('nav.forms') }}</SoraLink>
      <SoraLink href="#/forms" disabled>{{ t('demo.disabled') }}</SoraLink>
    </p>
  </DemoSection>
</template>
