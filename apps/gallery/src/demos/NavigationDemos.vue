<script setup lang="ts" vapor>
import { computed, ref } from 'vue'
import { SoraAccordion, SoraBreadcrumbs, SoraPagination, SoraTabs } from '@your-scope/ui'
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
  <DemoSection name="SoraTabs">
    <div class="grid gap-6 lg:grid-cols-2">
      <SoraTabs v-model="tab" :items="tabs" :label="t('demo.tabs.label')">
        <template #content="{ item }">
          <p class="text-sora-sm text-sora-muted">{{ item.body }}</p>
        </template>
      </SoraTabs>
      <SoraTabs
        v-model="sideTab"
        :items="tabs"
        :label="t('demo.tabs.label')"
        orientation="vertical"
        variant="pill"
        activation="manual"
      >
        <template #content="{ item }">
          <p class="text-sora-sm text-sora-muted">{{ item.body }}</p>
        </template>
      </SoraTabs>
    </div>
  </DemoSection>

  <DemoSection name="SoraAccordion">
    <SoraAccordion v-model="open" :items="questions" :heading-level="4" class="max-w-xl" />
  </DemoSection>

  <DemoSection name="SoraBreadcrumbs">
    <SoraBreadcrumbs :items="crumbs" />
  </DemoSection>

  <DemoSection name="SoraPagination">
    <div class="grid gap-3">
      <SoraPagination v-model:page="page" :total="240" :page-size="10" />
      <!-- A narrow container collapses to "Page x of y". -->
      <div class="w-56 rounded-sora border border-dashed border-sora-border p-2">
        <!-- Two navigation landmarks on one page need distinct names. -->
        <SoraPagination
          v-model:page="smallPage"
          :page-count="12"
          size="sm"
          :label="t('demo.pagination.compact')"
        />
      </div>
      <p class="text-sora-sm text-sora-muted" data-testid="page-value">
        {{ t('demo.page', { value: page }) }}
      </p>
    </div>
  </DemoSection>
</template>
