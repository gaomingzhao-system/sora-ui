<script setup lang="ts" vapor>
import { computed, ref } from 'vue'
import {
  SoraBreadcrumbs,
  SoraButton,
  SoraCard,
  SoraCombobox,
  SoraDialog,
  SoraDropdownMenu,
  SoraIconButton,
  SoraPagination,
  SoraProvider,
  SoraSlider,
  SoraTable,
  SoraTooltip,
  createSoraTranslator,
  iconSearch,
} from '@your-scope/ui'
import type { SoraMenuItem, SoraTableColumn } from '@your-scope/ui'
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
const columns = computed<SoraTableColumn<PatternRow>[]>(() => [
  { key: 'name', header: t('a11y.component'), rowHeader: true, width: '12rem' },
  { key: 'keyboard', header: t('a11y.interaction') },
])

const dialogOpen = ref(false)
const fruit = ref<string | null>(null)
const fruits = ['Apple', 'Banana', 'Cherry', 'Grape', 'Mango', 'Orange'].map((label) => ({
  value: label,
  label,
}))
const menu = computed<SoraMenuItem[]>(() => [
  { id: 'edit', label: t('demo.menu.edit') },
  { id: 'duplicate', label: t('demo.menu.duplicate') },
  { id: 'delete', label: t('demo.menu.delete'), color: 'error' },
])

// A right-to-left island with its own translator, independent of the page language.
const rtlTranslator = createSoraTranslator({ locale: 'ar', messages: { ar: arabic } })
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
      <p class="text-sora-muted">{{ t('a11y.lead') }}</p>
    </header>

    <section class="grid gap-3" aria-labelledby="overlays-title">
      <h2 id="overlays-title" class="text-sora-xl font-semibold">{{ t('a11y.overlays') }}</h2>
      <p class="text-sora-muted">{{ t('a11y.overlays.lead') }}</p>
      <SoraButton
        class="justify-self-start"
        variant="outline"
        color="neutral"
        data-testid="nested-open"
        @click="dialogOpen = true"
      >
        {{ t('demo.dialog.open') }}
      </SoraButton>
      <SoraDialog
        v-model:open="dialogOpen"
        :title="t('a11y.overlays')"
        :description="t('a11y.overlays.lead')"
        data-testid="nested-dialog"
      >
        <div class="grid gap-3">
          <SoraCombobox
            v-model="fruit"
            :options="fruits"
            :label="t('demo.fruit')"
            data-testid="nested-combobox"
          />
          <div class="flex flex-wrap items-center gap-2">
            <SoraDropdownMenu
              :items="menu"
              :trigger-label="t('demo.menu.trigger')"
              data-testid="nested-menu"
            />
            <SoraTooltip :text="t('demo.tooltip')">
              <template #default="{ describedBy }">
                <SoraIconButton
                  :label="t('demo.search')"
                  :icon="iconSearch"
                  variant="outline"
                  :aria-describedby="describedBy"
                  data-testid="nested-tooltip"
                />
              </template>
            </SoraTooltip>
          </div>
        </div>
        <template #footer="{ close }">
          <SoraButton @click="close">{{ t('actions.done') }}</SoraButton>
        </template>
      </SoraDialog>
    </section>

    <section class="grid gap-3" aria-labelledby="rtl-title">
      <h2 id="rtl-title" class="text-sora-xl font-semibold">{{ t('a11y.rtl') }}</h2>
      <p class="text-sora-muted">{{ t('a11y.rtl.lead') }}</p>
      <SoraProvider locale="ar" :translator="rtlTranslator" data-testid="rtl-island">
        <SoraCard class="max-w-xl">
          <div class="grid gap-3">
            <SoraBreadcrumbs :items="rtlCrumbs" />
            <SoraSlider v-model="rtlVolume" label="مستوى الصوت" show-value />
            <SoraPagination v-model:page="rtlPage" :page-count="9" />
          </div>
        </SoraCard>
      </SoraProvider>
    </section>

    <section class="grid gap-3" aria-labelledby="targets-title">
      <h2 id="targets-title" class="text-sora-xl font-semibold">{{ t('a11y.targets') }}</h2>
      <p class="text-sora-muted">{{ t('a11y.targets.lead') }}</p>
    </section>

    <section class="grid gap-3" aria-labelledby="patterns-title">
      <h2 id="patterns-title" class="text-sora-xl font-semibold">{{ t('a11y.patterns') }}</h2>
      <SoraTable
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
      </SoraTable>
    </section>
  </div>
</template>
