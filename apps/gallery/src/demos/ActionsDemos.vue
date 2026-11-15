<script setup lang="ts" vapor>
import { ref } from 'vue'
import {
  UiButton,
  UiButtonGroup,
  UiIcon,
  UiIconButton,
  UiLink,
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
  <DemoSection name="UiButton">
    <div class="grid gap-2">
      <div v-for="variant in variants" :key="variant" class="flex flex-wrap items-center gap-2">
        <UiButton v-for="color in colors" :key="color" :variant="variant" :color="color">{{
          t('demo.label')
        }}</UiButton>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <UiButton size="sm">{{ t('demo.add') }}</UiButton>
        <UiButton>{{ t('demo.add') }}</UiButton>
        <UiButton size="lg">{{ t('demo.add') }}</UiButton>
        <UiButton variant="outline" color="neutral">
          <template #leading><UiIcon :icon="iconPlus" /></template>
          {{ t('demo.add') }}
        </UiButton>
        <UiButton :loading="saving" data-testid="demo-save" @click="save">{{ t('demo.save') }}</UiButton>
        <UiButton disabled>{{ t('demo.disabled') }}</UiButton>
      </div>
    </div>
  </DemoSection>

  <DemoSection name="UiIconButton">
    <div class="flex flex-wrap items-center gap-2">
      <UiIconButton :label="t('demo.search')" :icon="iconSearch" />
      <UiIconButton :label="t('demo.add')" :icon="iconPlus" variant="outline" />
      <UiIconButton :label="t('demo.more')" :icon="iconMore" variant="soft" size="sm" />
      <UiIconButton :label="t('demo.add')" :icon="iconPlus" variant="solid" color="primary" size="lg" />
      <UiIconButton :label="t('demo.search')" :icon="iconSearch" loading />
      <UiIconButton :label="t('demo.search')" :icon="iconSearch" disabled />
    </div>
  </DemoSection>

  <DemoSection name="UiButtonGroup">
    <div class="flex flex-wrap items-center gap-4">
      <UiButtonGroup attached variant="outline" color="neutral" :label="t('demo.date')">
        <UiButton :aria-pressed="view === 'day'" @click="view = 'day'">1</UiButton>
        <UiButton :aria-pressed="view === 'week'" @click="view = 'week'">7</UiButton>
        <UiButton :aria-pressed="view === 'month'" @click="view = 'month'">30</UiButton>
      </UiButtonGroup>
      <UiButtonGroup size="sm" :label="t('workspace.actions')">
        <UiButton variant="ghost" color="neutral">{{ t('demo.cancel') }}</UiButton>
        <UiButton>{{ t('demo.save') }}</UiButton>
      </UiButtonGroup>
    </div>
  </DemoSection>

  <DemoSection name="UiLink">
    <p class="flex flex-wrap items-center gap-4">
      <UiLink href="#/foundations">{{ t('nav.foundations') }}</UiLink>
      <UiLink :href="docsUrl" external>{{ t('demo.docs') }}</UiLink>
      <UiLink href="#/forms" color="neutral" underline="hover">{{ t('nav.forms') }}</UiLink>
      <UiLink href="#/forms" disabled>{{ t('demo.disabled') }}</UiLink>
    </p>
  </DemoSection>
</template>
