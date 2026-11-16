<script setup lang="ts" vapor>
import { computed, ref } from 'vue'
import { UiAccordion, UiBreadcrumbs, UiPagination, UiTabs } from '@your-scope/ui'
import DemoSection from '../components/DemoSection.vue'
import { useT } from '../i18n.ts'

const t = useT()
const tab = ref('profile')
const sideTab = ref('security')
const open = ref(['q1'])
const page = ref(6)
const smallPage = ref(1)

const tabs = computed(() => [
  { value: 'profile', label: t('demo.tabs.profile'), body: t('demo.tabs.profile.body') },
  { value: 'security', label: t('demo.tabs.security'), body: t('demo.tabs.security.body') },
  { value: 'billing', label: t('demo.tabs.billing'), body: t('demo.tabs.billing.body') },
  { value: 'disabled', label: t('demo.disabled'), body: '', disabled: true },
])
const questions = computed(() => [
  { value: 'q1', label: t('demo.accordion.q1'), content: t('demo.accordion.a1') },
  { value: 'q2', label: t('demo.accordion.q2'), content: t('demo.accordion.a2') },
  { value: 'q3', label: t('demo.accordion.q3'), content: t('demo.accordion.a3') },
])
const crumbs = computed(() => [
  { label: t('demo.crumb.home'), href: '#/overview' },
  { label: t('demo.crumb.projects'), href: '#/components' },
  { label: t('demo.crumb.current') },
])
</script>

<template>
  <DemoSection name="UiTabs">
    <div class="grid gap-6 lg:grid-cols-2">
      <UiTabs v-model="tab" :items="tabs" :label="t('demo.tabs.label')">
        <template #content="{ item }">
          <p class="text-vui-sm text-vui-muted">{{ item.body }}</p>
        </template>
      </UiTabs>
      <UiTabs
        v-model="sideTab"
        :items="tabs"
        :label="t('demo.tabs.label')"
        orientation="vertical"
        variant="pill"
        activation="manual"
      >
        <template #content="{ item }">
          <p class="text-vui-sm text-vui-muted">{{ item.body }}</p>
        </template>
      </UiTabs>
    </div>
  </DemoSection>

  <DemoSection name="UiAccordion">
    <UiAccordion v-model="open" :items="questions" :heading-level="4" class="max-w-xl" />
  </DemoSection>

  <DemoSection name="UiBreadcrumbs">
    <UiBreadcrumbs :items="crumbs" />
  </DemoSection>

  <DemoSection name="UiPagination">
    <div class="grid gap-3">
      <UiPagination v-model:page="page" :total="240" :page-size="10" />
      <!-- A narrow container collapses to "Page x of y". -->
      <div class="w-56 rounded-vui border border-dashed border-vui-border p-2">
        <!-- Two navigation landmarks on one page need distinct names. -->
        <UiPagination
          v-model:page="smallPage"
          :page-count="12"
          size="sm"
          :label="t('demo.pagination.compact')"
        />
      </div>
      <p class="text-vui-sm text-vui-muted" data-testid="page-value">{{ t('demo.page', { value: page }) }}</p>
    </div>
  </DemoSection>
</template>
