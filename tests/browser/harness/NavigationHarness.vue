<script setup lang="ts" vapor>
import { UiAccordion, UiBreadcrumbs, UiPagination, UiProvider, UiTabs, iconUser } from '@your-scope/ui'
import type { UiAccordionItem, UiBreadcrumbItem, UiTabItem } from '@your-scope/ui'

export interface NavigationState {
  tab: string
  activation: 'automatic' | 'manual'
  orientation: 'horizontal' | 'vertical'
  open: string[]
  multiple: boolean
  collapsible: boolean
  page: number
  pageCount: number
  paginationWidth: string
  paginationDisabled: boolean
  locale: string
}

const { state } = defineProps<{ state: NavigationState }>()

// Narrowed item types: the models of these components are `item.value`.
interface Section extends UiTabItem {
  value: string
}
interface Question extends UiAccordionItem {
  value: string
}

const tabs: Section[] = [
  { value: 'profile', label: 'Profile', icon: iconUser },
  { value: 'billing', label: 'Billing' },
  { value: 'team', label: 'Team', disabled: true },
  { value: 'security', label: 'Security' },
]

const questions: Question[] = [
  { value: 'q1', label: 'What is included?', content: 'Everything in the catalogue.' },
  { value: 'q2', label: 'Can I theme it?' },
  { value: 'q3', label: 'Is it archived?', content: 'Not available.', disabled: true },
  { value: 'q4', label: 'Where are the docs?', content: 'In the docs folder.' },
]

const trail: UiBreadcrumbItem[] = [
  { label: 'Home', href: '#home' },
  { label: 'Projects', href: '#projects' },
  { label: 'Archive' },
  { label: 'Roadmap', href: '#roadmap' },
]
</script>

<template>
  <button type="button" data-testid="before">before</button>

  <UiTabs
    v-model="state.tab"
    data-testid="tabs"
    label="Account sections"
    :items="tabs"
    :activation="state.activation"
    :orientation="state.orientation"
  >
    <template #content="{ item }">
      <p data-testid="tab-content">{{ item.label }} content</p>
    </template>
  </UiTabs>

  <UiAccordion
    v-model="state.open"
    data-testid="accordion"
    :items="questions"
    :multiple="state.multiple"
    :collapsible="state.collapsible"
    :heading-level="4"
  >
    <template #content="{ item, open }">
      <span v-if="item.value === 'q2'" :data-testid="`panel-${item.value}`" :data-open="open">
        <a href="#theme" data-testid="panel-link">Read the theming guide</a>
      </span>
      <span v-else :data-testid="`panel-${item.value}`">{{ item.content }}</span>
    </template>
  </UiAccordion>

  <UiBreadcrumbs data-testid="breadcrumbs" :items="trail" />
  <UiBreadcrumbs data-testid="breadcrumbs-custom" label="Folder path" :items="trail">
    <template #item="{ item, current }">
      <span :data-current="current">[{{ item.label }}]</span>
    </template>
  </UiBreadcrumbs>

  <UiProvider :locale="state.locale">
    <div data-testid="pagination-box" :style="{ inlineSize: state.paginationWidth }">
      <UiPagination
        v-model:page="state.page"
        data-testid="pagination"
        :page-count="state.pageCount"
        :disabled="state.paginationDisabled"
      />
    </div>
    <UiPagination
      v-model:page="state.page"
      data-testid="pagination-total"
      label="Results pages"
      :total="95"
      :page-size="10"
    />
    <UiBreadcrumbs data-testid="breadcrumbs-localized" :items="trail" />
  </UiProvider>
</template>
