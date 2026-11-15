<script setup lang="ts" vapor>
import { computed, ref } from 'vue'
import {
  UiBreadcrumbs,
  UiButton,
  UiCard,
  UiCombobox,
  UiDialog,
  UiDropdownMenu,
  UiIconButton,
  UiPagination,
  UiProvider,
  UiSlider,
  UiTable,
  UiTooltip,
  createUiTranslator,
  iconSearch,
} from '@your-scope/ui'
import type { UiMenuItem, UiTableColumn } from '@your-scope/ui'
import arabic from '@your-scope/ui/locales/ar'
import { componentManifest } from '../../../../packages/ui/src/components.manifest.ts'
import { useT } from '../i18n.ts'

const t = useT()

interface PatternRow {
  name: string
  keyboard: readonly string[]
}
const patterns: PatternRow[] = componentManifest
  .filter((entry) => entry.keyboard.length > 0)
  .map((entry) => ({ name: entry.name, keyboard: entry.keyboard }))
const columns = computed<UiTableColumn<PatternRow>[]>(() => [
  { key: 'name', header: t('a11y.component'), rowHeader: true, width: '12rem' },
  { key: 'keyboard', header: t('a11y.interaction') },
])

const dialogOpen = ref(false)
const fruit = ref<string | null>(null)
const fruits = ['Apple', 'Banana', 'Cherry', 'Grape', 'Mango', 'Orange'].map((label) => ({
  value: label,
  label,
}))
const menu = computed<UiMenuItem[]>(() => [
  { id: 'edit', label: t('demo.menu.edit') },
  { id: 'duplicate', label: t('demo.menu.duplicate') },
  { id: 'delete', label: t('demo.menu.delete'), color: 'error' },
])

// A right-to-left island with its own translator, independent of the page language.
const rtlTranslator = createUiTranslator({ locale: 'ar', messages: { ar: arabic } })
const rtlPage = ref(3)
const rtlVolume = ref(30)
const rtlCrumbs = [
  { label: 'الرئيسية', href: '#/overview' },
  { label: 'المشاريع', href: '#/components' },
  { label: 'نظام التصميم' },
]
</script>

<template>
  <div class="grid gap-8">
    <header class="grid max-w-3xl gap-2">
      <h1 class="text-2xl font-semibold tracking-tight">{{ t('a11y.title') }}</h1>
      <p class="text-vui-muted">{{ t('a11y.lead') }}</p>
    </header>

    <section class="grid gap-3" aria-labelledby="overlays-title">
      <h2 id="overlays-title" class="text-vui-xl font-semibold">{{ t('a11y.overlays') }}</h2>
      <p class="text-vui-muted">{{ t('a11y.overlays.lead') }}</p>
      <UiButton
        class="justify-self-start"
        variant="outline"
        color="neutral"
        data-testid="nested-open"
        @click="dialogOpen = true"
      >
        {{ t('demo.dialog.open') }}
      </UiButton>
      <UiDialog
        v-model:open="dialogOpen"
        :title="t('a11y.overlays')"
        :description="t('a11y.overlays.lead')"
        data-testid="nested-dialog"
      >
        <div class="grid gap-3">
          <UiCombobox
            v-model="fruit"
            :options="fruits"
            :label="t('demo.fruit')"
            data-testid="nested-combobox"
          />
          <div class="flex flex-wrap items-center gap-2">
            <UiDropdownMenu :items="menu" :trigger-label="t('demo.menu.trigger')" data-testid="nested-menu" />
            <UiTooltip :text="t('demo.tooltip')">
              <template #default="{ describedBy }">
                <UiIconButton
                  :label="t('demo.search')"
                  :icon="iconSearch"
                  variant="outline"
                  :aria-describedby="describedBy"
                  data-testid="nested-tooltip"
                />
              </template>
            </UiTooltip>
          </div>
        </div>
        <template #footer="{ close }">
          <UiButton @click="close">{{ t('actions.done') }}</UiButton>
        </template>
      </UiDialog>
    </section>

    <section class="grid gap-3" aria-labelledby="rtl-title">
      <h2 id="rtl-title" class="text-vui-xl font-semibold">{{ t('a11y.rtl') }}</h2>
      <p class="text-vui-muted">{{ t('a11y.rtl.lead') }}</p>
      <UiProvider locale="ar" :translator="rtlTranslator" data-testid="rtl-island">
        <UiCard class="max-w-xl">
          <div class="grid gap-3">
            <UiBreadcrumbs :items="rtlCrumbs" />
            <UiSlider v-model="rtlVolume" label="مستوى الصوت" show-value />
            <UiPagination v-model:page="rtlPage" :page-count="9" />
          </div>
        </UiCard>
      </UiProvider>
    </section>

    <section class="grid gap-3" aria-labelledby="targets-title">
      <h2 id="targets-title" class="text-vui-xl font-semibold">{{ t('a11y.targets') }}</h2>
      <p class="text-vui-muted">{{ t('a11y.targets.lead') }}</p>
    </section>

    <section class="grid gap-3" aria-labelledby="patterns-title">
      <h2 id="patterns-title" class="text-vui-xl font-semibold">{{ t('a11y.patterns') }}</h2>
      <UiTable
        :columns="columns"
        :rows="patterns"
        row-key="name"
        :caption="t('a11y.patterns')"
        hide-caption
        size="sm"
      >
        <template #cell-name="{ row }"><code dir="ltr">{{ row.name }}</code></template>
        <template #cell-keyboard="{ row }">
          <!-- Reference text from the manifest (English). -->
          <ul class="g-reference grid list-disc gap-1 ps-4" lang="en" dir="ltr">
            <li v-for="line in row.keyboard" :key="line">{{ line }}</li>
          </ul>
        </template>
      </UiTable>
    </section>
  </div>
</template>
